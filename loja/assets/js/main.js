/* =========================================================================
   RAIZ & BARRO — Interações gerais
   -------------------------------------------------------------------------
   1. Configuração (TROQUE AQUI o WhatsApp, frete e cupons)
   2. Utilitários (moeda, fotos, toast)
   3. Cabeçalho, menu e navegação suave
   4. Animações ao rolar
   5. Extras (voltar ao topo, dúvidas, onda nos botões)
   ========================================================================= */

'use strict';

/* ---------- 1. CONFIGURAÇÃO ---------- */
const CONFIG = {
  // >>> TROQUE AQUI o WhatsApp da loja (55 + DDD + número). Número fictício.
  whatsapp: '5511999999999',
  freteGratisAcimaDe: 199,   // pedidos a partir deste valor não pagam frete
  valorFrete: 19.9,
  // Cupons de desconto (porcentagem). Ex.: BEMVINDO10 = 10% off
  cupons: { BEMVINDO10: 10 },
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

$$('[data-whats]').forEach((a) => { a.href = `https://wa.me/${CONFIG.whatsapp}`; });

/* ---------- 2. UTILITÁRIOS ---------- */
const moeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const urlFoto = (id, largura = 600) => `https://images.unsplash.com/photo-${id}?w=${largura}&q=65&auto=format&fit=crop`;
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let timerToast;
function toast(msg, tempo = 2800) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('visivel');
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.classList.remove('visivel'), tempo);
}

/** Lê/grava no navegador com segurança (pode falhar em aba anônima) */
const memoria = {
  ler(chave, padrao) { try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch (e) { return padrao; } },
  gravar(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* ignora */ } },
};

/* ---------- 3. CABEÇALHO, MENU E NAVEGAÇÃO ---------- */
const topo = $('#topo');
const menu = $('#menu');
const botaoMenu = $('#btn-menu');
const botaoTopo = $('#voltar-topo');
const linksMenu = $$('.menu ul a');
let rolandoPorClique = false;
let timerClique;

function aoRolar() {
  topo.classList.toggle('rolou', scrollY > 30);
  botaoTopo.classList.toggle('visivel', scrollY > 900);
}
let quadro = false;
addEventListener('scroll', () => { if (!quadro) { quadro = true; requestAnimationFrame(() => { aoRolar(); quadro = false; }); } }, { passive: true });
aoRolar();

function alternarMenu(abrir) {
  const abre = abrir ?? !menu.classList.contains('aberto');
  menu.classList.toggle('aberto', abre);
  botaoMenu.setAttribute('aria-expanded', String(abre));
  botaoMenu.setAttribute('aria-label', abre ? 'Fechar menu' : 'Abrir menu');
}
botaoMenu.addEventListener('click', () => alternarMenu());
document.addEventListener('click', (e) => {
  if (menu.classList.contains('aberto') && !menu.contains(e.target) && !botaoMenu.contains(e.target)) alternarMenu(false);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') alternarMenu(false); });

function marcarAtivo(id) { linksMenu.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === '#' + id)); }

function rolarAte(alvo) {
  rolandoPorClique = true;
  clearTimeout(timerClique);
  timerClique = setTimeout(() => { rolandoPorClique = false; }, 1200);
  const destino = alvo.getBoundingClientRect().top + scrollY - topo.offsetHeight - 8;
  scrollTo({ top: Math.max(0, destino), behavior: menosMovimento ? 'auto' : 'smooth' });
}

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

/* ---------- 4. ANIMAÇÕES AO ROLAR ---------- */
const observadorRevelar = new IntersectionObserver((entradas, obs) => {
  entradas.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add('visivel');
    obs.unobserve(el);
    const atraso = parseFloat(el.style.getPropertyValue('--atraso')) || 0;
    setTimeout(() => el.classList.remove('revelar'), 900 + atraso * 1000); // libera os efeitos de hover
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

function prepararRevelar(elementos) {
  elementos.forEach((el) => {
    const irmaos = [...el.parentElement.children].filter((c) => c.classList.contains('revelar'));
    const i = irmaos.indexOf(el);
    if (i > 0) el.style.setProperty('--atraso', Math.min(i * 0.07, 0.42) + 's');
    observadorRevelar.observe(el);
  });
}
prepararRevelar($$('.revelar'));

/* ---------- 5. EXTRAS ---------- */
botaoTopo.addEventListener('click', () => scrollTo({ top: 0, behavior: menosMovimento ? 'auto' : 'smooth' }));
$('#ano').textContent = new Date().getFullYear();

$$('.acordeao details').forEach((d, _, todos) => d.addEventListener('toggle', () => {
  if (d.open) todos.forEach((o) => { if (o !== d) o.open = false; });
}));

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

// Funções compartilhadas com carrinho.js e vitrine.js
window.Loja = { CONFIG, $, $$, moeda, urlFoto, escapar, toast, memoria, rolarAte, prepararRevelar, menosMovimento };
