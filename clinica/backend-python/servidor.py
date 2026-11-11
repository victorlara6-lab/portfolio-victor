"""
=============================================================================
CLÍNICA VITALIS — Servidor de agendamentos (Python)
-----------------------------------------------------------------------------
O que este servidor faz:
  1. Mostra o site (index.html, CSS, JS e imagens da pasta clinica/).
  2. Oferece uma API (endereços /api/...) que o site usa para:
       - saber quais horários já estão ocupados;
       - salvar novos agendamentos no banco de dados SQLite;
       - alimentar o painel administrativo (painel.html).

Usa SOMENTE a biblioteca padrão do Python (não precisa instalar nada).

Como rodar (no terminal, dentro da pasta clinica/):
    python backend-python/servidor.py

Depois abra no navegador:
    Site .......... http://localhost:8000
    Painel ........ http://localhost:8000/painel.html

Rotas da API:
    GET  /api/status                       -> {"ok": true}
    GET  /api/horarios-ocupados?data=AAAA-MM-DD&especialidade=X&medico=ID
    POST /api/agendamentos                 -> cria um agendamento (JSON)
    GET  /api/agendamentos?data=&status=   -> lista (usado pelo painel)
    POST /api/agendamentos/<id>/status     -> muda o status (painel)
    GET  /api/resumo                       -> números para o painel
=============================================================================
"""

from __future__ import annotations

import json
import re
import sqlite3
import sys
import threading
from datetime import date, datetime, timedelta
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

# ---------------------------------------------------------------------------
# Caminhos: tudo é calculado a partir da localização deste arquivo,
# então o servidor funciona não importa de qual pasta você rodar o comando.
# ---------------------------------------------------------------------------
PASTA_BACKEND = Path(__file__).resolve().parent
PASTA_SITE = PASTA_BACKEND.parent                      # pasta clinica/
ARQUIVO_BANCO = PASTA_BACKEND / "agendamentos.db"      # criado automaticamente
ARQUIVO_SCHEMA = PASTA_SITE / "banco-sql" / "schema.sql"
ARQUIVO_CONSULTAS = PASTA_SITE / "banco-sql" / "consultas.sql"
ARQUIVO_DADOS = PASTA_SITE / "dados" / "clinica.json"

HOST = "127.0.0.1"   # só aceita acessos do próprio computador (mais seguro)
PORTA = 8000

STATUS_VALIDOS = {"pendente", "confirmado", "cancelado", "concluido"}

# Evita que dois agendamentos sejam gravados exatamente ao mesmo tempo
trava_banco = threading.Lock()


# ===========================================================================
# 1. CARREGAR DADOS E CONSULTAS SQL
# ===========================================================================
def carregar_dados() -> dict:
    """Lê dados/clinica.json (especialidades, médicos e horários)."""
    with open(ARQUIVO_DADOS, encoding="utf-8") as arquivo:
        return json.load(arquivo)


def carregar_consultas() -> dict[str, str]:
    """
    Lê banco-sql/consultas.sql e separa cada consulta pelo nome.
    Cada bloco começa com a linha:  -- name: nome_da_consulta
    """
    texto = ARQUIVO_CONSULTAS.read_text(encoding="utf-8")
    consultas: dict[str, str] = {}
    partes = re.split(r"^--\s*name:\s*(\w+)\s*$", texto, flags=re.MULTILINE)
    # partes = [cabeçalho, nome1, sql1, nome2, sql2, ...]
    for nome, sql in zip(partes[1::2], partes[2::2]):
        consultas[nome] = sql.strip()
    return consultas


DADOS = carregar_dados()
SQL = carregar_consultas()
MEDICOS = {m["id"]: m for m in DADOS["medicos"]}


# ===========================================================================
# 2. BANCO DE DADOS (SQLite)
# ===========================================================================
def conectar() -> sqlite3.Connection:
    conexao = sqlite3.connect(ARQUIVO_BANCO)
    conexao.row_factory = sqlite3.Row   # permite acessar colunas pelo nome
    return conexao


def criar_banco() -> None:
    """Cria as tabelas (se ainda não existirem) usando o schema.sql."""
    with conectar() as conexao:
        conexao.executescript(ARQUIVO_SCHEMA.read_text(encoding="utf-8"))


# ===========================================================================
# 3. REGRAS DE NEGÓCIO (horários e validação)
# ===========================================================================
def horarios_do_dia(dia: date) -> list[str]:
    """Gera a lista de horários de atendimento de um dia (ex.: 08:00, 08:30...)."""
    # Python: segunda=0 ... domingo=6  |  JSON/JavaScript: domingo=0 ... sábado=6
    dia_js = (dia.weekday() + 1) % 7
    faixa = DADOS["horarios"].get(str(dia_js))
    if not faixa:
        return []
    inicio = datetime.combine(dia, datetime.strptime(faixa[0], "%H:%M").time())
    fim = datetime.combine(dia, datetime.strptime(faixa[1], "%H:%M").time())
    passo = timedelta(minutes=DADOS["intervalo_consulta_min"])
    lista = []
    while inicio < fim:
        lista.append(inicio.strftime("%H:%M"))
        inicio += passo
    return lista


def medicos_da_especialidade(especialidade: str) -> list[str]:
    return [m["id"] for m in DADOS["medicos"] if m["especialidade"] == especialidade]


def ocupados_do_medico(conexao: sqlite3.Connection, medico_id: str, data_iso: str) -> set[str]:
    linhas = conexao.execute(SQL["horarios_ocupados_do_medico"], (medico_id, data_iso)).fetchall()
    return {linha["horario"] for linha in linhas}


def horarios_ocupados(data_iso: str, especialidade: str, medico_id: str) -> list[str]:
    """
    Com médico escolhido: horários ocupados daquele médico.
    Sem preferência: horários em que TODOS os médicos da especialidade estão ocupados.
    """
    with conectar() as conexao:
        if medico_id:
            return sorted(ocupados_do_medico(conexao, medico_id, data_iso))
        ids = medicos_da_especialidade(especialidade)
        if not ids:
            return []
        conjuntos = [ocupados_do_medico(conexao, mid, data_iso) for mid in ids]
        return sorted(set.intersection(*conjuntos))


class ErroValidacao(Exception):
    """Erro com mensagem amigável para mostrar ao paciente."""


def validar_agendamento(d: dict) -> dict:
    """Confere todos os campos. Nunca confie só na validação do navegador!"""
    nome = str(d.get("nome", "")).strip()
    telefone = re.sub(r"\D", "", str(d.get("telefone", "")))
    email = str(d.get("email", "")).strip()
    especialidade = str(d.get("especialidade", "")).strip()
    medico_id = str(d.get("medico", "")).strip()
    data_iso = str(d.get("data", "")).strip()
    horario = str(d.get("horario", "")).strip()
    observacoes = str(d.get("observacoes", "")).strip()[:400]

    if len(nome) < 3 or len(nome) > 120:
        raise ErroValidacao("Nome inválido")
    if not 10 <= len(telefone) <= 11:
        raise ErroValidacao("Telefone inválido")
    if email and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]{2,}", email):
        raise ErroValidacao("E-mail inválido")
    if especialidade not in DADOS["especialidades"]:
        raise ErroValidacao("Especialidade inválida")
    if medico_id and (medico_id not in MEDICOS or MEDICOS[medico_id]["especialidade"] != especialidade):
        raise ErroValidacao("Médico inválido para essa especialidade")

    try:
        dia = date.fromisoformat(data_iso)
    except ValueError:
        raise ErroValidacao("Data inválida") from None
    hoje = date.today()
    if dia < hoje or dia > hoje + timedelta(days=DADOS["dias_para_agendar"]):
        raise ErroValidacao("Data fora do período de agendamento")
    if horario not in horarios_do_dia(dia):
        raise ErroValidacao("Horário fora do expediente")
    if dia == hoje and horario <= datetime.now().strftime("%H:%M"):
        raise ErroValidacao("Esse horário já passou")

    return {
        "nome": nome, "telefone": telefone, "email": email or None,
        "especialidade": especialidade, "medico_id": medico_id,
        "data": data_iso, "horario": horario, "observacoes": observacoes or None,
    }


def criar_agendamento(dados_brutos: dict) -> dict:
    """Valida, escolhe o médico (se 'sem preferência') e grava no banco."""
    a = validar_agendamento(dados_brutos)

    with trava_banco, conectar() as conexao:
        # Sem preferência: pega o primeiro médico livre da especialidade
        if not a["medico_id"]:
            livres = [
                mid for mid in medicos_da_especialidade(a["especialidade"])
                if a["horario"] not in ocupados_do_medico(conexao, mid, a["data"])
            ]
            if not livres:
                return {"conflito": True}
            a["medico_id"] = livres[0]

        quantidade = conexao.execute(SQL["contar_agendamentos_do_dia"], (a["data"],)).fetchone()[0]
        protocolo = f"VIT-{a['data'].replace('-', '')}-{quantidade + 1:04d}"

        try:
            conexao.execute(SQL["inserir_agendamento"], (
                protocolo, a["nome"], a["telefone"], a["email"], a["especialidade"],
                a["medico_id"], a["data"], a["horario"], a["observacoes"],
            ))
        except sqlite3.IntegrityError:
            # O índice único do banco detectou: horário já ocupado
            return {"conflito": True}

    return {"protocolo": protocolo, "medico": MEDICOS[a["medico_id"]]["nome"]}


# ===========================================================================
# 4. SERVIDOR HTTP
# ===========================================================================
class Manipulador(SimpleHTTPRequestHandler):
    """Responde às requisições: arquivos do site + rotas /api/..."""

    # Pastas/arquivos que NUNCA devem ser entregues ao navegador
    BLOQUEADOS = ("/backend-python", "/banco-sql")

    # ---------- utilitários ----------
    def enviar_json(self, corpo, status: int = 200) -> None:
        dados = json.dumps(corpo, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(dados)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(dados)

    def ler_json(self) -> dict:
        tamanho = int(self.headers.get("Content-Length", 0))
        if tamanho > 10_000:  # proteção contra envios gigantes
            raise ErroValidacao("Requisição muito grande")
        try:
            return json.loads(self.rfile.read(tamanho) or b"{}")
        except json.JSONDecodeError:
            raise ErroValidacao("JSON inválido") from None

    def log_message(self, formato, *args):
        # Log mais limpo no terminal
        sys.stdout.write(f"[{datetime.now():%H:%M:%S}] {self.command} {self.path} -> {args[1] if len(args) > 1 else ''}\n")

    # ---------- GET ----------
    def do_GET(self):
        url = urlparse(self.path)
        rota = url.path
        filtros = {k: v[0] for k, v in parse_qs(url.query).items()}

        # unquote + lower: impede truques como "/%62ackend-python" ou "/BACKEND-PYTHON" (Windows)
        rota_segura = unquote(rota).lower()
        if rota_segura.startswith(self.BLOQUEADOS) or rota_segura.endswith((".db", ".py", ".sql")):
            return self.enviar_json({"erro": "Acesso negado"}, HTTPStatus.FORBIDDEN)

        if rota == "/api/status":
            return self.enviar_json({"ok": True, "clinica": DADOS["clinica"]["nome"]})

        if rota == "/api/horarios-ocupados":
            try:
                date.fromisoformat(filtros.get("data", ""))
            except ValueError:
                return self.enviar_json({"erro": "Data inválida"}, HTTPStatus.BAD_REQUEST)
            ocupados = horarios_ocupados(filtros["data"], filtros.get("especialidade", ""), filtros.get("medico", ""))
            return self.enviar_json({"ocupados": ocupados})

        if rota == "/api/agendamentos":
            data_f = filtros.get("data", "")
            status_f = filtros.get("status", "")
            with conectar() as conexao:
                linhas = conexao.execute(SQL["listar_agendamentos"], (data_f, data_f, status_f, status_f)).fetchall()
            lista = []
            for linha in linhas:
                item = dict(linha)
                item["medico"] = MEDICOS.get(item["medico_id"], {}).get("nome", item["medico_id"])
                lista.append(item)
            return self.enviar_json({"agendamentos": lista})

        if rota == "/api/resumo":
            with conectar() as conexao:
                geral = dict(conexao.execute(SQL["resumo_geral"]).fetchone())
                por_esp = [dict(l) for l in conexao.execute(SQL["resumo_por_especialidade"]).fetchall()]
            geral = {k: (v or 0) for k, v in geral.items()}  # SUM() de tabela vazia vem como None
            return self.enviar_json({"geral": geral, "por_especialidade": por_esp})

        if rota.startswith("/api/"):
            return self.enviar_json({"erro": "Rota não encontrada"}, HTTPStatus.NOT_FOUND)

        # Qualquer outra coisa: entrega o arquivo do site (HTML, CSS, JS, imagens)
        return super().do_GET()

    # ---------- POST ----------
    def do_POST(self):
        rota = urlparse(self.path).path
        try:
            if rota == "/api/agendamentos":
                resultado = criar_agendamento(self.ler_json())
                if resultado.get("conflito"):
                    return self.enviar_json({"erro": "Horário indisponível"}, HTTPStatus.CONFLICT)
                print(f"   Novo agendamento: {resultado['protocolo']} com {resultado['medico']}")
                return self.enviar_json(resultado, HTTPStatus.CREATED)

            achou = re.fullmatch(r"/api/agendamentos/(\d+)/status", rota)
            if achou:
                novo = str(self.ler_json().get("status", ""))
                if novo not in STATUS_VALIDOS:
                    raise ErroValidacao("Status inválido")
                with conectar() as conexao:
                    cursor = conexao.execute(SQL["atualizar_status"], (novo, int(achou.group(1))))
                if cursor.rowcount == 0:
                    return self.enviar_json({"erro": "Agendamento não encontrado"}, HTTPStatus.NOT_FOUND)
                return self.enviar_json({"ok": True, "status": novo})

            return self.enviar_json({"erro": "Rota não encontrada"}, HTTPStatus.NOT_FOUND)

        except ErroValidacao as erro:
            return self.enviar_json({"erro": str(erro)}, HTTPStatus.BAD_REQUEST)
        except sqlite3.IntegrityError:
            # Ex.: tentar reativar um agendamento cujo horário já foi ocupado por outro
            return self.enviar_json({"erro": "Horário já ocupado por outro agendamento"}, HTTPStatus.CONFLICT)


# ===========================================================================
# 5. INICIAR
# ===========================================================================
def main() -> None:
    criar_banco()
    manipulador = partial(Manipulador, directory=str(PASTA_SITE))
    servidor = ThreadingHTTPServer((HOST, PORTA), manipulador)
    print("=" * 60)
    print(" Clinica Vitalis - servidor de agendamentos")
    print("=" * 60)
    print(f" Site ...... http://localhost:{PORTA}")
    print(f" Painel .... http://localhost:{PORTA}/painel.html")
    print(f" Banco ..... {ARQUIVO_BANCO}")
    print(" Para parar: Ctrl + C")
    print("=" * 60)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
        servidor.server_close()


if __name__ == "__main__":
    main()
