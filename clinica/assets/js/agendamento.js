/* =========================================================================
   CLÍNICA VITALIS — Formulário de agendamento
   -------------------------------------------------------------------------
   Como funciona:
   - Monta as listas de especialidades e médicos lendo os cards da página
     (assim, para adicionar um médico, basta adicionar o card no HTML).
   - Gera os horários do dia escolhido e bloqueia os que já passaram.
   - Valida os campos e mostra mensagens de erro amigáveis.
   - Envio:
       • COM o servidor Python rodando  → salva no banco de dados (SQLite)
         e bloqueia horários já ocupados.
       • SEM servidor (ex.: GitHub Pages) → monta a mensagem e abre o WhatsApp.
   ========================================================================= */

'use strict';

(function agendamento() {
  const { CONFIG, abrirModal, toast, paraMinutos, paraHHMM } = window.Vitalis;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const form = $('#form-agendamento');
  const campoEspecialidade = $('#f-especialidade');
  const campoMedico = $('#f-medico');
  const campoData = $('#f-data');
  const campoTelefone = $('#f-telefone');
  const caixaHorarios = $('#horarios');
  const botaoEnviar = $('#btn-enviar');

  let servidorOnline = false;   // muda para true se o servidor Python responder
  let horarioEscolhido = '';

  /* ---------- 1. Dados vindos da própria página ---------- */
  const especialidades = $$('.especialidade').map((c) => c.dataset.especialidade);
  const medicos = $$('.medico').map((c) => ({ id: c.dataset.id, nome: c.dataset.nome, especialidade: c.dataset.especialidade }));

  especialidades.forEach((nome) => campoEspecialidade.add(new Option(nome, nome)));

  /** Preenche o select de médicos (filtrando pela especialidade escolhida) */
  function atualizarMedicos(manterSelecionado = '') {
    const esp = campoEspecialidade.value;
    campoMedico.innerHTML = '';
    campoMedico.add(new Option('Sem preferência', ''));
    medicos
      .filter((m) => !esp || m.especialidade === esp)
      .forEach((m) => campoMedico.add(new Option(esp ? m.nome : `${m.nome} (${m.especialidade})`, m.id)));
    campoMedico.value = manterSelecionado;
  }
  atualizarMedicos();

  campoEspecialidade.addEventListener('change', () => { atualizarMedicos(); limparErro(campoEspecialidade); atualizarHorarios(); });
  campoMedico.addEventListener('change', () => {
    // Se escolheu o médico antes da especialidade, preenche a especialidade sozinho
    const m = medicos.find((x) => x.id === campoMedico.value);
    if (m && campoEspecialidade.value !== m.especialidade) {
      campoEspecialidade.value = m.especialidade;
      atualizarMedicos(m.id);
      limparErro(campoEspecialidade);
    }
    atualizarHorarios();
  });

  /* Pré-seleção vinda dos botões "Agendar com..." e do modal de especialidade */
  document.addEventListener('vitalis:preselecionar', (e) => {
    const { especialidade, medico } = e.detail;
    if (especialidade) campoEspecialidade.value = especialidade;
    atualizarMedicos(medico || '');
    limparErro(campoEspecialidade);
    atualizarHorarios();
    // Destaque visual no formulário
    form.animate(
      [{ boxShadow: '0 0 0 0 rgba(25,179,155,.6)' }, { boxShadow: '0 0 0 14px rgba(25,179,155,0)' }],
      { duration: 900, delay: 500 }
    );
    setTimeout(() => $('#f-nome').focus({ preventScroll: true }), 700);
  });

  /* ---------- 2. Data: hoje até 60 dias ---------- */
  const dataISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hoje = new Date();
  const limite = new Date(); limite.setDate(hoje.getDate() + 60);
  campoData.min = dataISO(hoje);
  campoData.max = dataISO(limite);

  /** Converte "2026-11-20" em Date sem problemas de fuso horário */
  const lerData = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };

  campoData.addEventListener('change', () => { horarioEscolhido = ''; atualizarHorarios(); });

  /* ---------- 3. Horários ---------- */
  async function atualizarHorarios() {
    const valor = campoData.value;
    caixaHorarios.innerHTML = '';
    caixaHorarios.setAttribute('role', 'radiogroup');
    caixaHorarios.setAttribute('aria-label', 'Horários disponíveis');

    if (!valor) return mostrarVazio('Escolha uma data para ver os horários.');

    const data = lerData(valor);
    const faixa = CONFIG.horarios[data.getDay()];
    if (!faixa) {
      mostrarErro(campoData, 'Não atendemos aos domingos. Escolha outro dia.');
      return mostrarVazio('Sem atendimento neste dia.');
    }
    if (valor < campoData.min || valor > campoData.max) {
      mostrarErro(campoData, 'Escolha uma data entre hoje e os próximos 60 dias.');
      return mostrarVazio('Data fora do período de agendamento.');
    }
    limparErro(campoData);

    // Gera a lista de horários (ex.: 08:00, 08:30, ... até o fechamento)
    const lista = [];
    for (let m = paraMinutos(faixa[0]); m < paraMinutos(faixa[1]); m += CONFIG.intervaloConsulta) lista.push(paraHHMM(m));

    // Hoje: bloqueia horários que já passaram (com 1h de antecedência)
    const ehHoje = valor === dataISO(new Date());
    const agoraMin = new Date().getHours() * 60 + new Date().getMinutes() + 60;

    // Pergunta ao servidor (se existir) quais horários já estão ocupados
    const ocupados = await buscarOcupados(valor);

    let algumLivre = false;
    lista.forEach((hora, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'horario';
      b.textContent = hora;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(hora === horarioEscolhido));
      b.style.animationDelay = i * 0.02 + 's';
      const indisponivel = (ehHoje && paraMinutos(hora) < agoraMin) || ocupados.includes(hora);
      b.disabled = indisponivel;
      if (indisponivel) b.setAttribute('aria-label', `${hora} indisponível`);
      else algumLivre = true;
      b.addEventListener('click', () => escolherHorario(hora));
      caixaHorarios.appendChild(b);
    });

    if (!algumLivre) mostrarVazio('Todos os horários deste dia já foram preenchidos. Tente outra data.', true);
    if (ocupados.includes(horarioEscolhido)) horarioEscolhido = '';
  }

  function escolherHorario(hora) {
    horarioEscolhido = hora;
    $$('.horario', caixaHorarios).forEach((b) => b.setAttribute('aria-checked', String(b.textContent === hora)));
    limparErro(caixaHorarios);
  }

  function mostrarVazio(texto, acrescentar = false) {
    if (!acrescentar) caixaHorarios.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'horarios__vazio';
    p.textContent = texto;
    caixaHorarios.appendChild(p);
  }

  /* ---------- 4. Máscara de telefone: (11) 99999-9999 ---------- */
  campoTelefone.addEventListener('input', () => {
    const d = campoTelefone.value.replace(/\D/g, '').slice(0, 11);
    let r = d;
    if (d.length > 2) r = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) r = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    campoTelefone.value = r;
  });

  /* ---------- 5. Validação ---------- */
  function caixaDoCampo(el) { return el.closest('.campo') || el.closest('.aceite'); }

  function mostrarErro(el, mensagem) {
    const caixa = caixaDoCampo(el);
    const destino = el.name === 'aceite' ? $('.campo__erro--aceite') : $('.campo__erro', caixa);
    caixa.classList.remove('invalido');
    void caixa.offsetWidth; // reinicia a animação de "tremer"
    caixa.classList.add('invalido');
    destino.textContent = mensagem;
    if (el.setAttribute) el.setAttribute('aria-invalid', 'true');
  }

  function limparErro(el) {
    const caixa = caixaDoCampo(el);
    if (!caixa) return;
    caixa.classList.remove('invalido');
    const destino = el.name === 'aceite' ? $('.campo__erro--aceite') : $('.campo__erro', caixa);
    if (destino) destino.textContent = '';
    el.removeAttribute?.('aria-invalid');
  }

  // Limpa o erro assim que a pessoa começa a corrigir
  $$('input, select, textarea', form).forEach((el) => el.addEventListener('input', () => limparErro(el)));

  function validar() {
    const erros = [];
    const nome = form.nome.value.trim();
    const telefone = form.telefone.value.replace(/\D/g, '');
    const email = form.email.value.trim();

    if (nome.split(/\s+/).length < 2 || nome.length < 5) erros.push([form.nome, 'Digite seu nome e sobrenome.']);
    if (telefone.length < 10) erros.push([form.telefone, 'Digite um WhatsApp válido com DDD.']);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erros.push([form.email, 'Este e-mail parece incorreto.']);
    if (!form.especialidade.value) erros.push([form.especialidade, 'Escolha uma especialidade.']);
    if (!form.data.value) erros.push([form.data, 'Escolha a data da consulta.']);
    else if (!CONFIG.horarios[lerData(form.data.value).getDay()]) erros.push([form.data, 'Não atendemos aos domingos.']);
    if (!horarioEscolhido) erros.push([caixaHorarios, 'Escolha um horário.']);
    if (!form.aceite.checked) erros.push([form.aceite, 'É preciso concordar para continuarmos.']);

    erros.forEach(([el, msg]) => mostrarErro(el, msg));
    if (erros.length) {
      const primeiro = erros[0][0];
      (primeiro === caixaHorarios ? caixaHorarios : primeiro).scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (primeiro.focus && primeiro !== caixaHorarios) primeiro.focus({ preventScroll: true });
      toast('Confira os campos destacados 👆');
    }
    return erros.length === 0;
  }

  /* ---------- 6. Servidor Python (opcional) ---------- */
  async function verificarServidor() {
    if (!location.protocol.startsWith('http')) return false; // abriu o arquivo direto (file://)
    try {
      const r = await fetch('api/status', { signal: AbortSignal.timeout(2500) });
      if (!r.ok) return false;
      const json = await r.json();
      return json.ok === true;
    } catch (e) {
      return false;
    }
  }

  async function buscarOcupados(data) {
    if (!servidorOnline) return [];
    try {
      const params = new URLSearchParams({ data, especialidade: campoEspecialidade.value, medico: campoMedico.value });
      const r = await fetch('api/horarios-ocupados?' + params);
      return r.ok ? (await r.json()).ocupados : [];
    } catch (e) {
      return [];
    }
  }

  verificarServidor().then((online) => {
    servidorOnline = online;
    const status = $('#status-servidor');
    status.hidden = false;
    status.innerHTML = online
      ? '🟢 <b>Sistema online:</b> seu agendamento é salvo direto na agenda da clínica.'
      : '💬 <b>Modo demonstração:</b> sua solicitação será enviada pelo WhatsApp da clínica.';
    if (campoData.value) atualizarHorarios();
  });

  /* ---------- 7. Envio ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validar()) return;

    const dados = {
      nome: form.nome.value.trim(),
      telefone: form.telefone.value.replace(/\D/g, ''),
      email: form.email.value.trim(),
      especialidade: form.especialidade.value,
      medico: form.medico.value,
      data: form.data.value,
      horario: horarioEscolhido,
      observacoes: form.observacoes.value.trim(),
    };
    const nomeMedico = (medicos.find((m) => m.id === dados.medico) || {}).nome || 'Sem preferência';
    const dataBR = lerData(dados.data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

    if (!servidorOnline) return enviarPorWhatsApp(dados, nomeMedico, dataBR);

    // Envia para o servidor Python
    carregando(true);
    try {
      const r = await fetch('api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const resposta = await r.json();
      if (r.status === 409) {
        toast('Ops! Esse horário acabou de ser reservado. Escolha outro. ⏰', 4500);
        horarioEscolhido = '';
        atualizarHorarios();
        return;
      }
      if (!r.ok) throw new Error(resposta.erro || 'Erro no servidor');
      mostrarSucesso(dados, nomeMedico, dataBR, resposta.protocolo);
    } catch (erro) {
      // Se o servidor falhar, não perde o paciente: oferece o WhatsApp
      abrirModal({
        titulo: 'Não conseguimos salvar agora',
        corpo: `<p>${escapar(erro.message)}. Você pode enviar sua solicitação pelo WhatsApp.</p>`,
        acoes: [{ texto: 'Enviar pelo WhatsApp', href: linkWhatsApp(dados, nomeMedico, dataBR) }],
      });
    } finally {
      carregando(false);
    }
  });

  function carregando(sim) {
    botaoEnviar.disabled = sim;
    botaoEnviar.classList.toggle('carregando', sim);
    $('.btn__texto', botaoEnviar).textContent = sim ? 'Enviando…' : 'Confirmar agendamento';
  }

  function linkWhatsApp(d, nomeMedico, dataBR) {
    const texto =
      `Olá! Gostaria de agendar uma consulta na Clínica Vitalis.\n\n` +
      `*Nome:* ${d.nome}\n*Especialidade:* ${d.especialidade}\n*Médico(a):* ${nomeMedico}\n` +
      `*Data:* ${dataBR}\n*Horário:* ${d.horario}` +
      (d.observacoes ? `\n*Observações:* ${d.observacoes}` : '');
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
  }

  function enviarPorWhatsApp(dados, nomeMedico, dataBR) {
    const link = linkWhatsApp(dados, nomeMedico, dataBR);
    window.open(link, '_blank', 'noopener');
    mostrarSucesso(dados, nomeMedico, dataBR, null, link);
  }

  function mostrarSucesso(d, nomeMedico, dataBR, protocolo, linkWhats) {
    const primeiroNome = escapar(d.nome.split(' ')[0]);
    abrirModal({
      sucesso: true,
      icone: '<svg class="ic"><use href="#i-check"/></svg>',
      titulo: protocolo ? `Consulta agendada, ${primeiroNome}!` : `Quase lá, ${primeiroNome}!`,
      corpo:
        (protocolo
          ? `<p>Seu horário está reservado. Enviaremos a confirmação no seu WhatsApp.</p>`
          : `<p>Abrimos o WhatsApp com sua solicitação pronta. É só tocar em <b>enviar</b> para a clínica confirmar.</p>`) +
        `<div class="modal__resumo">
           ${protocolo ? `<span><b>Protocolo:</b> ${escapar(protocolo)}</span>` : ''}
           <span><b>Especialidade:</b> ${escapar(d.especialidade)}</span>
           <span><b>Médico(a):</b> ${escapar(nomeMedico)}</span>
           <span><b>Quando:</b> ${escapar(dataBR)}, às ${escapar(d.horario)}</span>
         </div>
         <p>Chegue 15 minutos antes e traga um documento com foto.</p>`,
      acoes: linkWhats
        ? [{ texto: 'Abrir WhatsApp de novo', href: linkWhats }, { texto: 'Fechar', classe: 'btn--contorno' }]
        : [{ texto: 'Perfeito!' }],
    });
    form.reset();
    horarioEscolhido = '';
    atualizarMedicos();
    mostrarVazio('Escolha uma data para ver os horários.');
  }

  /** Evita que um texto digitado pelo usuário vire HTML (segurança contra XSS) */
  function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
