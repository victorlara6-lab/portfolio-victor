/* =========================================================================
   CLÍNICA VITALIS — Painel da recepção
   Conversa com a API do servidor Python para listar, filtrar e mudar o
   status dos agendamentos. Também exporta uma planilha CSV (abre no Excel).
   ========================================================================= */

'use strict';

const $ = (s, r = document) => r.querySelector(s);
const formFiltros = $('#filtros');
let agendamentos = [];   // última lista recebida do servidor

/* ---------- Comunicação com a API ---------- */
async function api(caminho, opcoes) {
  const r = await fetch(caminho, opcoes);
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.erro || `Erro ${r.status}`);
  return json;
}

async function carregar() {
  const filtros = new URLSearchParams({ data: formFiltros.data.value, status: formFiltros.status.value });
  try {
    const [lista, resumo] = await Promise.all([api('api/agendamentos?' + filtros), api('api/resumo')]);
    agendamentos = lista.agendamentos;
    $('#offline').hidden = true;
    $('#area-painel').hidden = false;
    desenharResumo(resumo);
    desenharTabela();
    $('#atualizado').textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    // Servidor desligado ou página aberta sem o Python
    $('#offline').hidden = false;
    $('#area-painel').hidden = true;
  }
}

/* ---------- Desenho da tela ---------- */
function desenharResumo({ geral, por_especialidade }) {
  $('#r-total').textContent = geral.total;
  $('#r-hoje').textContent = geral.hoje;
  $('#r-pendentes').textContent = geral.pendentes;
  $('#r-confirmados').textContent = geral.confirmados;
  $('#r-cancelados').textContent = geral.cancelados;

  const maior = Math.max(1, ...por_especialidade.map((e) => e.quantidade));
  const lista = $('#grafico');
  lista.innerHTML = por_especialidade.length
    ? por_especialidade.map((e) => `
        <li>
          <span class="grafico__rotulo"><span>${escapar(e.especialidade)}</span><b>${e.quantidade}</b></span>
          <span class="grafico__barra"><i data-largura="${(e.quantidade / maior) * 100}"></i></span>
        </li>`).join('')
    : '<li><small>Sem dados ainda.</small></li>';
  // Anima as barras depois de desenhar
  requestAnimationFrame(() => lista.querySelectorAll('i').forEach((i) => { i.style.width = i.dataset.largura + '%'; }));
}

function desenharTabela() {
  const busca = formFiltros.busca.value.trim().toLowerCase();
  const filtrados = agendamentos.filter((a) => !busca || a.nome.toLowerCase().includes(busca) || a.telefone.includes(busca.replace(/\D/g, '') || '§'));

  $('#vazio').hidden = filtrados.length > 0;
  $('#linhas').innerHTML = filtrados.map((a, i) => `
    <tr style="animation-delay:${Math.min(i * 0.03, 0.4)}s">
      <td><b>${formatarData(a.data)}</b><small>${a.horario} · ${escapar(a.protocolo)}</small></td>
      <td><b>${escapar(a.nome)}</b><small>${formatarTelefone(a.telefone)}${a.email ? ' · ' + escapar(a.email) : ''}</small>
          ${a.observacoes ? `<small>📝 ${escapar(a.observacoes)}</small>` : ''}</td>
      <td>${escapar(a.especialidade)}<small>${escapar(a.medico)}</small></td>
      <td><span class="etiqueta-status etiqueta-status--${a.status}">${a.status}</span></td>
      <td><div class="acoes-linha">
        ${a.status === 'pendente' ? `<button class="acao" data-id="${a.id}" data-status="confirmado">Confirmar</button>` : ''}
        ${a.status === 'confirmado' ? `<button class="acao" data-id="${a.id}" data-status="concluido">Concluir</button>` : ''}
        ${a.status !== 'cancelado' && a.status !== 'concluido' ? `<button class="acao acao--perigo" data-id="${a.id}" data-status="cancelado">Cancelar</button>` : ''}
        <a class="acao" href="${linkWhats(a)}" target="_blank" rel="noopener">WhatsApp</a>
      </div></td>
    </tr>`).join('');
}

/* ---------- Ações ---------- */
$('#linhas').addEventListener('click', async (e) => {
  const botao = e.target.closest('button[data-status]');
  if (!botao) return;
  const novo = botao.dataset.status;
  if (novo === 'cancelado' && !confirm('Cancelar este agendamento? O horário volta a ficar livre.')) return;
  botao.disabled = true;
  try {
    await api(`api/agendamentos/${botao.dataset.id}/status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: novo }),
    });
    toast(`Agendamento marcado como ${novo}.`);
    carregar();
  } catch (erro) {
    toast(erro.message);
    botao.disabled = false;
  }
});

formFiltros.addEventListener('change', carregar);
formFiltros.busca.addEventListener('input', desenharTabela);
formFiltros.addEventListener('reset', () => setTimeout(carregar, 0));
formFiltros.addEventListener('submit', (e) => e.preventDefault());
$('#btn-atualizar').addEventListener('click', () => { carregar(); toast('Lista atualizada'); });

/* Exporta a lista atual como CSV (separado por ";" para abrir certinho no Excel brasileiro) */
$('#btn-csv').addEventListener('click', () => {
  const colunas = ['protocolo', 'data', 'horario', 'nome', 'telefone', 'email', 'especialidade', 'medico', 'status', 'observacoes'];
  const celula = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [colunas.join(';'), ...agendamentos.map((a) => colunas.map((c) => celula(a[c])).join(';'))];
  // "﻿" (BOM) faz o Excel reconhecer os acentos corretamente
  const arquivo = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(arquivo);
  link.download = `agendamentos-vitalis-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast('Planilha exportada 📊');
});

/* ---------- Utilitários ---------- */
function formatarData(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}
function formatarTelefone(t) {
  return t.length === 11 ? `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}` : `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`;
}
function linkWhats(a) {
  const texto = `Olá, ${a.nome.split(' ')[0]}! Aqui é da Clínica Vitalis. Confirmando sua consulta de ${a.especialidade} em ${formatarData(a.data)} às ${a.horario}. Podemos confirmar?`;
  return `https://wa.me/55${a.telefone}?text=${encodeURIComponent(texto)}`;
}
function escapar(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
let timerToast;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('visivel');
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.classList.remove('visivel'), 2800);
}

carregar();
setInterval(carregar, 30000); // atualização automática
