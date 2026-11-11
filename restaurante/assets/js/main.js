/* =========================================================================
   CUCINA LUME — Interações gerais da página
   -------------------------------------------------------------------------
   1. Configuração (TROQUE AQUI WhatsApp e horários)
   2. Utilitários (toast, horários)
   3. Cabeçalho, menu e navegação suave
   4. Animações ao rolar e contadores
   5. "Aberto agora" e tabela de horários
   6. Carrossel de pratos (arrastar + setas)
   7. Galeria em tela cheia
   8. Extras
   ========================================================================= */

'use strict';

/* ---------- 1. CONFIGURAÇÃO ---------- */
const CONFIG = {
  // >>> TROQUE AQUI o WhatsApp do restaurante (55 + DDD + número). Número fictício.
  whatsapp: '5511999999999',

  // Horário de funcionamento: 0 = domingo ... 6 = sábado.
  // Cada dia tem uma lista de turnos [abre, fecha]. Lista vazia = fechado.
  // "24:00" significa meia-noite.
  horarios: {
    0: [['12:00', '16:00']],
    1: [],
    2: [['12:00', '15:00'], ['19:00', '23:00']],
    3: [['12:00', '15:00'], ['19:00', '23:00']],
    4: [['12:00', '15:00'], ['19:00', '23:00']],
    5: [['12:00', '15:00'], ['19:00', '24:00']],
    6: [['12:00', '15:00'], ['19:00', '24:00']],
  },
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

$$('[data-whats]').forEach((a) => { a.href = `https://wa.me/${CONFIG.whatsapp}`; });

/* ---------- 2. UTILITÁRIOS ---------- */
const paraMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const paraHHMM = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const formatarHora = (hhmm) => (hhmm === '24:00' ? '0h' : hhmm.replace(':00', 'h').replace(':', 'h'));

let timerToast;
function toast(msg, tempo = 3200) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('visivel');
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.classList.remove('visivel'), tempo);
}

/* ---------- 3. CABEÇALHO, MENU E NAVEGAÇÃO ---------- */
const topo = $('#topo');
const menu = $('#menu');
const botaoMenu = $('#btn-menu');
const botaoTopo = $('#voltar-topo');
const linksMenu = $$('.menu ul a');
let rolandoPorClique = false;
let timerClique;

function aoRolar() {
  topo.classList.toggle('rolou', scrollY > 40);
  botaoTopo.classList.toggle('visivel', scrollY > 800);
}
let quadro = false;
addEventListener('scroll', () => { if (!quadro) { quadro = true; requestAnimationFrame(() => { aoRolar(); quadro = false; }); } }, { passive: true });
aoRolar();

function alternarMenu(abrir) {
  const abre = abrir ?? !menu.classList.contains('aberto');
  menu.classList.toggle('aberto', abre);
  document.body.classList.toggle('menu-aberto', abre);
  botaoMenu.setAttribute('aria-expanded', String(abre));
  botaoMenu.setAttribute('aria-label', abre ? 'Fechar menu' : 'Abrir menu');
}
botaoMenu.addEventListener('click', () => alternarMenu());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('aberto')) alternarMenu(false); });
matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) alternarMenu(false); });

function marcarAtivo(id) { linksMenu.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === '#' + id)); }

/** Rola até a seção descontando a altura do cabeçalho fixo */
function rolarAte(alvo) {
  rolandoPorClique = true;
  clearTimeout(timerClique);
  timerClique = setTimeout(() => { rolandoPorClique = false; }, 1200);
  const destino = alvo.getBoundingClientRect().top + scrollY - topo.offsetHeight + 1;
  scrollTo({ top: Math.max(0, destino), behavior: menosMovimento ? 'auto' : 'smooth' });
}

// Todos os links internos (#cardapio, #reservas...) passam por aqui
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href').slice(1);
  const alvo = id && document.getElementById(id);
  if (!alvo) return;
  e.preventDefault();
  alternarMenu(false);
  if (link.closest('.menu')) marcarAtivo(id);
  rolarAte(alvo);
  history.pushState(null, '', '#' + id);
});

const observadorSecoes = new IntersectionObserver((entradas) => {
  if (rolandoPorClique) return;
  entradas.forEach((en) => { if (en.isIntersecting) marcarAtivo(en.target.id); });
}, { rootMargin: '-45% 0px -50% 0px' });
linksMenu.forEach((a) => { const s = $(a.getAttribute('href')); if (s) observadorSecoes.observe(s); });

/* ---------- 4. ANIMAÇÕES AO ROLAR E CONTADORES ---------- */
function prepararRevelar(elementos) {
  elementos.forEach((el) => {
    const irmaos = [...el.parentElement.children].filter((c) => c.classList.contains('revelar'));
    const i = irmaos.indexOf(el);
    if (i > 0) el.style.setProperty('--atraso', Math.min(i * 0.09, 0.45) + 's');
    observadorRevelar.observe(el);
  });
}
const observadorRevelar = new IntersectionObserver((entradas, obs) => {
  entradas.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add('visivel');
    $$('[data-contador]', el).forEach(animarContador);
    obs.unobserve(el);
    const atraso = parseFloat(el.style.getPropertyValue('--atraso')) || 0;
    setTimeout(() => el.classList.remove('revelar'), 1000 + atraso * 1000); // libera os efeitos de hover
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
prepararRevelar($$('.revelar'));

function animarContador(el) {
  const alvo = Number(el.dataset.contador);
  const sufixo = el.dataset.sufixo || '';
  const inicio = performance.now();
  const duracao = 1500;
  (function passo(agora) {
    const t = Math.min((agora - inicio) / duracao, 1);
    el.textContent = Math.round(alvo * (1 - Math.pow(1 - t, 3))) + sufixo;
    if (t < 1) requestAnimationFrame(passo);
  })(inicio);
}

/* ---------- 5. "ABERTO AGORA" E TABELA DE HORÁRIOS ---------- */
(function horarios() {
  const agora = new Date();
  const dia = agora.getDay();
  const minAgora = agora.getHours() * 60 + agora.getMinutes();
  const turnos = CONFIG.horarios[dia];
  const status = $('#status-casa');
  const texto = $('span:last-child', status);

  const turnoAtual = turnos.find(([a, f]) => minAgora >= paraMin(a) && minAgora < paraMin(f));
  if (turnoAtual) {
    status.classList.add('aberto');
    texto.textContent = `Aberto agora · fecha às ${formatarHora(turnoAtual[1])}`;
  } else {
    status.classList.add('fechado');
    // Procura a próxima abertura (hoje mais tarde ou nos próximos dias)
    const proximoHoje = turnos.find(([a]) => paraMin(a) > minAgora);
    if (proximoHoje) texto.textContent = `Fechado agora · abre hoje às ${formatarHora(proximoHoje[0])}`;
    else {
      for (let d = 1; d <= 7; d++) {
        const outro = (dia + d) % 7;
        if (CONFIG.horarios[outro].length) {
          const quando = d === 1 ? 'amanhã' : NOMES_DIAS[outro].toLowerCase();
          texto.textContent = `Fechado agora · abre ${quando} às ${formatarHora(CONFIG.horarios[outro][0][0])}`;
          break;
        }
      }
    }
  }

  // Tabela de horários da semana (começando na segunda), com o dia de hoje destacado
  const corpo = $('#tabela-horarios tbody');
  [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
    const tr = document.createElement('tr');
    if (d === dia) tr.className = 'hoje';
    const t = CONFIG.horarios[d];
    tr.innerHTML = `<td>${NOMES_DIAS[d]}</td><td>${t.length ? t.map(([a, f]) => `${formatarHora(a)} – ${formatarHora(f)}`).join(' · ') : 'Fechado'}</td>`;
    corpo.appendChild(tr);
  });
})();

/* ---------- 6. CARROSSEL DE PRATOS (arrastar + setas) ---------- */
function iniciarTrilho(trilho) {
  const passo = () => (trilho.firstElementChild?.offsetWidth || 300) + 18;
  $$('[data-trilho]').forEach((b) => b.addEventListener('click', () => {
    trilho.scrollBy({ left: b.dataset.trilho === 'proximo' ? passo() : -passo(), behavior: menosMovimento ? 'auto' : 'smooth' });
  }));

  // Arrastar com o mouse (no celular o próprio dedo já rola)
  let inicioX = 0, scrollInicial = 0, arrastou = false, apertado = false;
  trilho.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    apertado = true; arrastou = false; inicioX = e.clientX; scrollInicial = trilho.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!apertado) return;
    const dx = e.clientX - inicioX;
    if (Math.abs(dx) > 5) { arrastou = true; trilho.classList.add('arrastando'); }
    if (arrastou) trilho.scrollLeft = scrollInicial - dx;
  });
  addEventListener('pointerup', () => {
    if (!apertado) return;
    apertado = false;
    trilho.classList.remove('arrastando');
  });
  // Setas do teclado quando o carrossel está focado
  trilho.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); trilho.scrollBy({ left: passo(), behavior: 'smooth' }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); trilho.scrollBy({ left: -passo(), behavior: 'smooth' }); }
  });
}

/* ---------- 7. GALERIA EM TELA CHEIA ---------- */
(function galeria() {
  const itens = $$('.galeria__item');
  const caixa = $('#lightbox');
  const img = $('#lightbox-img');
  const legenda = $('#lightbox-legenda');
  let atual = 0;

  function mostrar(i) {
    atual = (i + itens.length) % itens.length;
    const item = itens[atual];
    const alt = $('img', item).alt;
    img.src = `https://images.unsplash.com/photo-${item.dataset.foto}?w=1600&q=75&auto=format&fit=max`;
    img.alt = alt;
    legenda.textContent = alt;
    // reinicia a animação de entrada da foto
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
  }

  itens.forEach((item, i) => item.addEventListener('click', () => { mostrar(i); caixa.showModal(); }));
  caixa.addEventListener('click', (e) => {
    const acao = e.target.closest('[data-lightbox]')?.dataset.lightbox;
    if (acao === 'fechar') caixa.close();
    else if (acao === 'anterior') mostrar(atual - 1);
    else if (acao === 'proximo') mostrar(atual + 1);
    else if (e.target === caixa) caixa.close(); // clicou no fundo
  });
  caixa.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') mostrar(atual + 1);
    if (e.key === 'ArrowLeft') mostrar(atual - 1);
  });
  // Deslizar o dedo para trocar de foto
  let toqueX = null;
  caixa.addEventListener('touchstart', (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
  caixa.addEventListener('touchend', (e) => {
    if (toqueX === null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1));
    toqueX = null;
  });
})();

/* ---------- 8. EXTRAS ---------- */
botaoTopo.addEventListener('click', () => scrollTo({ top: 0, behavior: menosMovimento ? 'auto' : 'smooth' }));
$('#ano').textContent = new Date().getFullYear();

// Onda ao clicar em botões
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.btn');
  if (!b) return;
  const r = b.getBoundingClientRect();
  const t = Math.max(r.width, r.height);
  const onda = document.createElement('span');
  onda.className = 'onda-clique';
  onda.style.cssText = `width:${t}px;height:${t}px;left:${e.clientX - r.left - t / 2}px;top:${e.clientY - r.top - t / 2}px`;
  b.appendChild(onda);
  onda.addEventListener('animationend', () => onda.remove());
});

// Deixa funções disponíveis para cardapio.js e reserva.js
window.Lume = { CONFIG, toast, paraMin, paraHHMM, prepararRevelar, iniciarTrilho, NOMES_DIAS };
