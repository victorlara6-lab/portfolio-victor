/* =========================================================================
   PORTFÓLIO DE VICTOR — Interações
   -------------------------------------------------------------------------
   1. Configuração (TROQUE AQUI seu WhatsApp e link do Workana)
   2. Cabeçalho, menu e navegação suave
   3. Animações ao rolar
   4. Janela de código que "digita"
   5. Prévia ao vivo dos sites (iframes encolhidos)
   6. Efeitos de mouse (luz nos cards e no topo)
   7. Formulário de orçamento → WhatsApp
   8. Extras (onda nos botões, ano, voltar ao topo, dúvidas)
   ========================================================================= */

'use strict';

/* ---------- 1. CONFIGURAÇÃO ---------- */
const CONFIG = {
  // >>> TROQUE pelo SEU número (55 + DDD + número, só dígitos)
  whatsapp: '5544991016921',
  // >>> Cole aqui o link do seu perfil no Workana (deixe '' para esconder o botão)
  workana: 'https://www.workana.com/freelancer/6f1714c6d8a179efbdaed61bd7704dc3',
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const temMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Atualiza os links de WhatsApp e mostra o Workana se estiver configurado
$$('[data-whats]').forEach((a) => { a.href = `https://wa.me/${CONFIG.whatsapp}`; });
if (CONFIG.workana) { const w = $('[data-workana]'); w.href = CONFIG.workana; w.hidden = false; }

/* ---------- 2. CABEÇALHO, MENU E NAVEGAÇÃO ---------- */
const topo = $('#topo');
const menu = $('#menu');
const botaoMenu = $('#btn-menu');
const botaoTopo = $('#voltar-topo');
const linksMenu = $$('.menu ul a');
let rolandoPorClique = false;
let timerClique;

function aoRolar() {
  const y = scrollY;
  const total = document.documentElement.scrollHeight - innerHeight;
  topo.classList.toggle('rolou', y > 20);
  $('#progresso').style.transform = `scaleX(${total > 0 ? y / total : 0})`;
  botaoTopo.classList.toggle('visivel', y > 700);
  // No fim da página, "Contato" fica marcado
  if (!rolandoPorClique && innerHeight + y >= document.documentElement.scrollHeight - 4) marcarAtivo('contato');
}
let quadroPedido = false;
addEventListener('scroll', () => { if (!quadroPedido) { quadroPedido = true; requestAnimationFrame(() => { aoRolar(); quadroPedido = false; }); } }, { passive: true });
aoRolar();

function alternarMenu(abrir) {
  const abre = abrir ?? !menu.classList.contains('aberto');
  menu.classList.toggle('aberto', abre);
  botaoMenu.setAttribute('aria-expanded', String(abre));
  botaoMenu.setAttribute('aria-label', abre ? 'Fechar menu' : 'Abrir menu');
}
botaoMenu.addEventListener('click', () => alternarMenu());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') alternarMenu(false); });
document.addEventListener('click', (e) => {
  if (menu.classList.contains('aberto') && !menu.contains(e.target) && !botaoMenu.contains(e.target)) alternarMenu(false);
});

function marcarAtivo(id) {
  linksMenu.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === '#' + id));
}

/** Rola até a seção descontando a altura do cabeçalho fixo */
function rolarAte(alvo) {
  rolandoPorClique = true;
  clearTimeout(timerClique);
  timerClique = setTimeout(() => { rolandoPorClique = false; }, 1200);
  const destino = alvo.getBoundingClientRect().top + scrollY - topo.offsetHeight - 8;
  scrollTo({ top: Math.max(0, destino), behavior: menosMovimento ? 'auto' : 'smooth' });
}

// Todos os links internos (#servicos, #contato...) passam por aqui
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

// Destaca no menu a seção que está no meio da tela
const observadorSecoes = new IntersectionObserver((entradas) => {
  if (rolandoPorClique) return;
  entradas.forEach((en) => { if (en.isIntersecting) marcarAtivo(en.target.id); });
}, { rootMargin: '-45% 0px -50% 0px' });
linksMenu.forEach((a) => { const s = $(a.getAttribute('href')); if (s) observadorSecoes.observe(s); });

/* ---------- 3. ANIMAÇÕES AO ROLAR ---------- */
// Irmãos aparecem em cascata
$$('.revelar').forEach((el) => {
  const irmaos = [...el.parentElement.children].filter((c) => c.classList.contains('revelar'));
  const i = irmaos.indexOf(el);
  if (i > 0) el.style.setProperty('--atraso', Math.min(i * 0.1, 0.5) + 's');
});
const observadorRevelar = new IntersectionObserver((entradas, obs) => {
  entradas.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add('visivel');
    obs.unobserve(el);
    // Depois da entrada, remove a classe para os efeitos de hover responderem na hora
    const atraso = parseFloat(el.style.getPropertyValue('--atraso')) || 0;
    setTimeout(() => el.classList.remove('revelar'), 1100 + atraso * 1000);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
$$('.revelar').forEach((el) => observadorRevelar.observe(el));

/* ---------- 4. JANELA DE CÓDIGO QUE "DIGITA" ---------- */
(function digitar() {
  const destino = $('#codigo-digitando');
  const codigo =
`// Seu próximo projeto começa aqui ✨
const projeto = {
  cliente: "Sua empresa",
  tipo: "Site + automação",
  funcionaNoCelular: true,
  prazo: "combinado e cumprido",
};

function entregar(projeto) {
  return criarAlgoIncrivel(projeto);
}

entregar(projeto); // 🚀`;

  // Separa o código em pedaços coloridos (comentários, textos, palavras-chave, funções)
  const regra = /(\/\/.*|"[^"]*"|\b(?:const|function|return|true)\b|\b[a-zA-Z]+(?=\())/g;
  const pedacos = [];
  let ultimo = 0;
  for (const m of codigo.matchAll(regra)) {
    if (m.index > ultimo) pedacos.push(['', codigo.slice(ultimo, m.index)]);
    const t = m[0];
    const classe = t.startsWith('//') ? 'c-comentario' : t.startsWith('"') ? 'c-texto' : /^(const|function|return|true)$/.test(t) ? 'c-palavra' : 'c-funcao';
    pedacos.push([classe, t]);
    ultimo = m.index + t.length;
  }
  pedacos.push(['', codigo.slice(ultimo)]);

  const criarSpan = (classe) => { const s = document.createElement('span'); if (classe) s.className = classe; destino.appendChild(s); return s; };

  if (menosMovimento) { pedacos.forEach(([c, t]) => { criarSpan(c).textContent = t; }); return; }

  let p = 0, letra = 0, span = null;
  function passo() {
    if (p >= pedacos.length) return;
    const [classe, texto] = pedacos[p];
    if (!span) span = criarSpan(classe);
    span.textContent += texto[letra++];
    if (letra >= texto.length) { p++; letra = 0; span = null; }
    const ch = texto[letra - 1];
    setTimeout(passo, ch === '\n' ? 140 : 18 + Math.random() * 30); // pausa maior ao quebrar a linha
  }
  setTimeout(passo, 900);
})();

/* ---------- 5. PRÉVIA AO VIVO DOS SITES ---------- */
// O iframe tem o tamanho real (ex.: 1280px) e é encolhido para caber na moldura
const telas = $$('.previa__tela');
function ajustarPrevias() {
  telas.forEach((tela) => {
    const escala = tela.clientWidth / Number(tela.dataset.largura);
    tela.querySelector('iframe').style.transform = `scale(${escala})`;
  });
}
new ResizeObserver(ajustarPrevias).observe($('#previa'));
ajustarPrevias();

/* ---------- 6. EFEITOS DE MOUSE ---------- */
if (temMouse && !menosMovimento) {
  // Luz que segue o mouse nos cards
  $$('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
  // Luz roxa do topo acompanha o mouse (a variável CSS é herdada pelo .hero__luz)
  const hero = $('.hero');
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--lx', `${((e.clientX - r.left) / r.width) * 100}%`);
    hero.style.setProperty('--ly', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
}

/* ---------- 7. FORMULÁRIO DE ORÇAMENTO → WHATSAPP ---------- */
const form = $('#form-contato');

// Botões "Quero esse" dos preços já marcam a opção no formulário
$$('[data-plano]').forEach((b) => b.addEventListener('click', () => {
  const opcao = $(`input[name="tipo"][value="${b.dataset.plano}"]`);
  if (opcao) { opcao.checked = true; limparErro(opcao); }
  setTimeout(() => form.nome.focus({ preventScroll: true }), 800);
}));

function caixa(el) { return el.closest('.campo'); }
function mostrarErro(el, msg) {
  const c = caixa(el);
  c.classList.remove('invalido'); void c.offsetWidth; c.classList.add('invalido');
  $('.campo__erro', c).textContent = msg;
}
function limparErro(el) {
  const c = caixa(el);
  c.classList.remove('invalido');
  const e = $('.campo__erro', c); if (e) e.textContent = '';
}
$$('input, textarea', form).forEach((el) => el.addEventListener('input', () => limparErro(el)));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = form.nome.value.trim();
  const tipo = form.tipo.value;
  const mensagem = form.mensagem.value.trim();
  const erros = [];
  if (nome.length < 2) erros.push([form.nome, 'Me diga seu nome 🙂']);
  if (!tipo) erros.push([$('#opcoes-projeto input'), 'Escolha uma opção.']);
  if (mensagem.length < 10) erros.push([form.mensagem, 'Conte um pouquinho mais (mínimo 10 letras).']);
  erros.forEach(([el, msg]) => mostrarErro(el, msg));
  if (erros.length) return;

  const empresa = form.empresa.value.trim();
  const texto =
    `Olá, Victor! Vi seu portfólio e quero um orçamento.\n\n` +
    `*Nome:* ${nome}\n` + (empresa ? `*Empresa:* ${empresa}\n` : '') +
    `*Preciso de:* ${tipo}\n*Detalhes:* ${mensagem}`;
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  toast('Abrimos o WhatsApp com sua mensagem pronta! 💬');
  form.reset();
});

/* ---------- 8. EXTRAS ---------- */
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

botaoTopo.addEventListener('click', () => scrollTo({ top: 0, behavior: menosMovimento ? 'auto' : 'smooth' }));
$('#ano').textContent = new Date().getFullYear();

// Dúvidas: abrir uma fecha as outras
$$('.acordeao details').forEach((d, _, todos) => d.addEventListener('toggle', () => {
  if (d.open) todos.forEach((o) => { if (o !== d) o.open = false; });
}));

let timerToast;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('visivel');
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.classList.remove('visivel'), 3200);
}
