/* =========================================================================
   CUCINA LUME — Reserva de mesa
   -------------------------------------------------------------------------
   - Mostra os horários de almoço e jantar do dia escolhido (a partir do
     CONFIG.horarios do main.js), bloqueando horários que já passaram.
   - Contador de pessoas (1 a 12).
   - Valida e monta a mensagem pronta para o WhatsApp do restaurante.
   ========================================================================= */

'use strict';

(function reserva() {
  const { CONFIG, toast, paraMin, paraHHMM, NOMES_DIAS } = window.Lume;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const form = $('#form-reserva');
  const campoData = $('#r-data');
  const campoTel = $('#r-telefone');
  const caixaHorarios = $('#horarios');
  const saidaPessoas = $('#r-pessoas');
  const MAX_PESSOAS = 12;
  const ULTIMA_RESERVA_ANTES = 60; // a última reserva é 1h antes de fechar
  const INTERVALO = 30;            // minutos entre os horários
  let pessoas = 2;
  let horario = '';

  /* ---------- Datas: hoje até 60 dias ---------- */
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const lerData = (v) => { const [a, m, d] = v.split('-').map(Number); return new Date(a, m - 1, d); };
  const hoje = new Date();
  const limite = new Date(); limite.setDate(hoje.getDate() + 60);
  campoData.min = iso(hoje);
  campoData.max = iso(limite);

  /* ---------- Pessoas (botões − e +) ---------- */
  function atualizarPessoas(novo) {
    pessoas = Math.min(MAX_PESSOAS, Math.max(1, novo));
    saidaPessoas.textContent = pessoas;
    saidaPessoas.classList.remove('pulou'); void saidaPessoas.offsetWidth; saidaPessoas.classList.add('pulou');
    $('[data-pessoas="-1"]').disabled = pessoas === 1;
    $('[data-pessoas="1"]').disabled = pessoas === MAX_PESSOAS;
    if (pessoas === MAX_PESSOAS) toast('Para mais de 12 pessoas, fale com a gente pelo WhatsApp 😉');
  }
  $$('[data-pessoas]').forEach((b) => b.addEventListener('click', () => atualizarPessoas(pessoas + Number(b.dataset.pessoas))));
  atualizarPessoas(2);

  /* ---------- Horários do dia ---------- */
  campoData.addEventListener('change', () => { horario = ''; limparErro(campoData); desenharHorarios(); });

  function desenharHorarios() {
    caixaHorarios.innerHTML = '';
    if (!campoData.value) return vazio('Escolha o dia para ver os horários.');
    if (campoData.value < campoData.min || campoData.value > campoData.max) {
      erro(campoData, 'Escolha um dia entre hoje e os próximos 60 dias.');
      return vazio('Data fora do período de reservas.');
    }
    const data = lerData(campoData.value);
    const turnos = CONFIG.horarios[data.getDay()];
    if (!turnos.length) {
      erro(campoData, `Às ${NOMES_DIAS[data.getDay()].toLowerCase()}s estamos fechados.`);
      return vazio('Sem atendimento neste dia. Escolha outro 🙂');
    }

    const ehHoje = campoData.value === iso(new Date());
    const agora = new Date().getHours() * 60 + new Date().getMinutes() + 30; // 30 min de antecedência
    let algumLivre = false;

    turnos.forEach(([abre, fecha]) => {
      const inicio = paraMin(abre);
      const nomeTurno = inicio < 17 * 60 ? 'Almoço' : 'Jantar';
      const titulo = document.createElement('p');
      titulo.className = 'horarios__turno';
      titulo.textContent = nomeTurno;
      const grade = document.createElement('div');
      grade.className = 'horarios__grade';
      grade.setAttribute('role', 'radiogroup');
      grade.setAttribute('aria-label', `Horários de ${nomeTurno.toLowerCase()}`);

      let i = 0;
      for (let m = inicio; m <= paraMin(fecha) - ULTIMA_RESERVA_ANTES; m += INTERVALO) {
        const h = paraHHMM(m);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'horario';
        b.textContent = h;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(h === horario));
        b.style.animationDelay = (i++ * 0.03) + 's';
        b.disabled = ehHoje && m < agora;
        if (!b.disabled) algumLivre = true;
        b.addEventListener('click', () => escolher(h));
        grade.appendChild(b);
      }
      caixaHorarios.append(titulo, grade);
    });
    if (!algumLivre) vazio('Os horários de hoje já passaram. Que tal amanhã?', true);
  }

  function escolher(h) {
    horario = h;
    $$('.horario', caixaHorarios).forEach((b) => b.setAttribute('aria-checked', String(b.textContent === h)));
    limparErro(caixaHorarios);
  }

  function vazio(texto, acrescentar = false) {
    if (!acrescentar) caixaHorarios.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'horarios__vazio';
    p.textContent = texto;
    caixaHorarios.appendChild(p);
  }

  /* ---------- Máscara do telefone ---------- */
  campoTel.addEventListener('input', () => {
    const d = campoTel.value.replace(/\D/g, '').slice(0, 11);
    let r = d;
    if (d.length > 2) r = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) r = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    campoTel.value = r;
  });

  /* ---------- Validação ---------- */
  const caixa = (el) => el.closest('.campo');
  function erro(el, msg) {
    const c = caixa(el);
    c.classList.remove('invalido'); void c.offsetWidth; c.classList.add('invalido');
    $('.campo__erro', c).textContent = msg;
  }
  function limparErro(el) {
    const c = caixa(el);
    c.classList.remove('invalido');
    $('.campo__erro', c).textContent = '';
  }
  $$('input:not([type=radio]), textarea', form).forEach((el) => el.addEventListener('input', () => { if (caixa(el)?.querySelector('.campo__erro')) limparErro(el); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim();
    const tel = form.telefone.value.replace(/\D/g, '');
    const erros = [];
    if (nome.length < 2) erros.push([form.nome, 'Como podemos te chamar?']);
    if (tel.length < 10) erros.push([form.telefone, 'Digite um WhatsApp com DDD.']);
    if (!campoData.value) erros.push([campoData, 'Escolha o dia.']);
    else if (!CONFIG.horarios[lerData(campoData.value).getDay()].length) erros.push([campoData, 'Estamos fechados neste dia.']);
    if (!horario) erros.push([caixaHorarios, 'Escolha um horário.']);
    erros.forEach(([el, msg]) => erro(el, msg));
    if (erros.length) {
      caixa(erros[0][0]).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const dataBR = lerData(campoData.value).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    const ocasiao = form.ocasiao.value;
    const obs = form.observacoes.value.trim();
    const texto =
      `Olá! Gostaria de reservar uma mesa na Cucina Lume 🍝\n\n` +
      `*Nome:* ${nome}\n*Dia:* ${dataBR}\n*Horário:* ${horario}\n*Pessoas:* ${pessoas}` +
      (ocasiao ? `\n*Ocasião:* ${ocasiao}` : '') +
      (obs ? `\n*Observações:* ${obs}` : '');

    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    toast(`Pronto, ${nome.split(' ')[0]}! É só enviar a mensagem no WhatsApp 🍷`, 4500);
    form.reset();
    horario = '';
    atualizarPessoas(2);
    vazio('Escolha o dia para ver os horários.');
  });
})();
