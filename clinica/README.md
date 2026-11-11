# Clínica Vitalis — Site + Sistema de Agendamento

> **Projeto de portfólio de Victor.** A Clínica Vitalis é uma empresa **fictícia**: nomes, médicos, CRMs, convênios e depoimentos são inventados para demonstração.

Site institucional para clínica médica, com **agendamento online**, **painel da recepção** e **banco de dados**. Funciona no celular, tablet e computador.

## O que tem no projeto

**Site (`index.html`)**
- Menu fixo com efeito de vidro, barra de progresso de leitura e menu hambúrguer animado no celular
- Tema **claro/escuro** (lembra a escolha do visitante)
- Título com palavras que se alternam, números que contam sozinhos e foto com forma orgânica animada
- Faixa de convênios rolando sem parar
- 6 especialidades com botão **"Saiba mais"** que abre uma janela de detalhes
- Equipe com **filtro por especialidade** e botão **"Agendar com..."** que já preenche o formulário
- Carrossel de depoimentos (setas, bolinhas, arrastar com o dedo, troca automática)
- **Formulário de agendamento** com máscara de telefone, validação, horários do dia e bloqueio de horários ocupados
- Perguntas frequentes (acordeão), mapa gratuito (OpenStreetMap), "Aberto agora" automático, copiar endereço
- Botão de WhatsApp pulsando e botão "voltar ao topo"
- Acessibilidade: navegação por teclado, textos para leitores de tela e respeito a "reduzir movimento"

**Painel da recepção (`painel.html`)**
- Resumo do dia (total, hoje, pendentes, confirmados, cancelados)
- Gráfico das especialidades mais procuradas
- Lista com filtros por data, status e busca por nome/telefone
- Botões para confirmar, concluir ou cancelar, e link direto para o WhatsApp do paciente
- **Exportar planilha** (CSV que abre no Excel)

## Linguagens e organização das pastas

| Pasta / arquivo | Linguagem | Para que serve |
|---|---|---|
| `index.html`, `painel.html` | **HTML** | Estrutura das páginas |
| `assets/css/` | **CSS** | Visual, animações e responsividade (celular primeiro) |
| `assets/js/` | **JavaScript** | Interações do site, agendamento e painel |
| `assets/img/` | SVG | Logo e ícone da aba (desenhados à mão) |
| `dados/clinica.json` | **JSON** | Médicos, especialidades e horários de atendimento |
| `backend-python/servidor.py` | **Python** | Servidor web + API de agendamentos |
| `banco-sql/` | **SQL** | Estrutura do banco SQLite e consultas usadas pela API |
| `versao-1/` | HTML | Primeira versão do site, guardada para comparar "antes e depois" |

```
clinica/
├── index.html               ← site
├── painel.html              ← painel da recepção (precisa do Python)
├── assets/
│   ├── css/  style.css, painel.css
│   ├── js/   main.js, agendamento.js, painel.js
│   └── img/  logo.svg, favicon.svg
├── dados/          clinica.json
├── backend-python/ servidor.py
├── banco-sql/      schema.sql, consultas.sql
└── versao-1/       index.html (versão antiga)
```

## Como rodar

**Só o site:** dê dois cliques no `index.html`. O agendamento funciona em **modo demonstração** e envia a solicitação pelo WhatsApp.

**Site + agendamento salvo no banco + painel:** abra o terminal na pasta `clinica` e rode:

```bash
python backend-python/servidor.py
```

Depois acesse:
- Site: http://localhost:8000
- Painel: http://localhost:8000/painel.html

Não precisa instalar nada: o servidor usa só a biblioteca padrão do Python. O banco (`backend-python/agendamentos.db`) é criado sozinho na primeira vez. Para parar, aperte `Ctrl + C`.

> No GitHub Pages só a parte HTML/CSS/JS fica no ar (o GitHub Pages não roda Python). O site percebe isso sozinho e usa o WhatsApp.

## Como adaptar para um cliente real

1. **WhatsApp:** troque `whatsapp` no topo de `assets/js/main.js` (e em `dados/clinica.json`).
2. **Cores:** troque as variáveis no topo de `assets/css/style.css` (`--petroleo`, `--menta`, `--coral`).
3. **Médicos:** copie um card `<article class="card medico">` no `index.html` e adicione o mesmo `id` em `dados/clinica.json`.
4. **Horários:** altere `horarios` em `main.js` **e** em `dados/clinica.json` (os dois precisam ser iguais).
5. **Fotos:** troque os links do Unsplash pelas fotos reais da clínica.

> O painel não tem login porque é uma demonstração que roda só no seu computador (`127.0.0.1`). Para um cliente real, é preciso adicionar autenticação antes de colocar o servidor na internet.

---
*Site demonstrativo — projeto de portfólio de Victor.* Fotos: [Unsplash](https://unsplash.com) (licença gratuita).
