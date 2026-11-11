/* =========================================================================
   CLÍNICA VITALIS — JavaScript principal (interações da página)
   -------------------------------------------------------------------------
   Tudo em JavaScript puro, sem bibliotecas.
   Índice:
    1. Configuração (TROQUE AQUI o WhatsApp e os horários)
    2. Utilitários (modal, toast)
    3. Cabeçalho: fundo ao rolar, barra de progresso, voltar ao topo
    4. Menu do celular (hambúrguer)
    5. Link ativo no menu conforme a seção visível
    6. Tema claro/escuro
    7. Animações ao rolar (revelar) e contadores
    8. Palavras alternando no título
    9. "Próximo horário" e "Aberto agora"
   10. Especialidades: modal "Saiba mais"
   11. Equipe: filtros
   12. Carrossel de depoimentos
   13. Dúvidas (acordeão), copiar endereço, extras
   ========================================================================= */

'use strict';

/* ---------- 1. CONFIGURAÇÃO ---------- */
const CONFIG = {
  // >>> TROQUE AQUI o número do WhatsApp (código do país + DDD + número, só dígitos).
  //     Todos os botões de WhatsApp da página são atualizados automaticamente.
  whatsapp: '5511999999999',

  // Horário de funcionamento (mantenha igual ao arquivo dados/clinica.json, usado pelo Python)
  // dia da semana: 0 = domingo, 1 = segunda ... 6 = sábado. null = fechado.
  horarios: {
    0: null,
    1: ['08:00', '18:00'], 2: ['08:00', '18:00'], 3: ['08:00', '18:00'],
    4: ['08:00', '18:00'], 5: ['08:00', '18:00'],
    6: ['08:00', '12:00'],
  },
  intervaloConsulta: 30, // minutos entre um horário e outro
};

/* Atalhos para selecionar elementos */
const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
const prefereMenosMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Atualiza todos os links de WhatsApp com o número da configuração */
$$('[data-whats]').forEach((link) => {
  const url = new URL(link.href);
  url.pathname = '/' + CONFIG.whatsapp;
  link.href = url.toString();
});

/* ---------- 2. UTILITÁRIOS: MODAL E TOAST ---------- */
const modal = $('#modal');

/**
 * Abre o modal com o conteúdo informado.
 * @param {object} op - { titulo, icone (HTML), corpo (HTML), acoes: [{texto, classe, href, aoClicar}], sucesso }
 */
function abrirModal({ titulo, icone = '', corpo = '', acoes = [], sucesso = false }) {
  $('#modal-titulo').textContent = titulo;
  const caixaIcone = $('#modal-icone');
  caixaIcone.innerHTML = icone;
  caixaIcone.classList.toggle('sucesso', sucesso);
  $('#modal-corpo').innerHTML = corpo;

  const caixaAcoes = $('#modal-acoes');
  caixaAcoes.innerHTML = '';
  acoes.forEach((acao) => {
    const el = document.createElement(acao.href ? 'a' : 'button');
    el.className = 'btn ' + (acao.classe || 'btn--primario');
    el.innerHTML = acao.texto;
    if (acao.href) { el.href = acao.href; el.target = '_blank'; el.rel = 'noopener'; }
    else el.type = 'button';
    el.addEventListener('click', () => { if (acao.aoClicar) acao.aoClicar(); fecharModal(); });
    caixaAcoes.appendChild(el);
  });

  if (typeof modal.showModal === 'function') modal.showModal();
  else modal.setAttribute('open', ''); // navegadores muito antigos
}

function fecharModal() {
  if (typeof modal.close === 'function') modal.close();
  else modal.removeAttribute('open');
}

$$('[data-fechar-modal]').forEach((b) => b.addEventListener('click', fecharModal));
// Clicar fora da caixa (no fundo escuro) também fecha
modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });

let timerToast;
/** Mostra uma mensagem rápida na parte de baixo da tela */
function toast(mensagem, duracao = 3200) {
  const el = $('#toast');
  el.textContent = mensagem;
  el.classList.add('visivel');
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.classList.remove('visivel'), duracao);
}

/** Rola suavemente até a seção de agendamento e pré-seleciona especialidade/médico */
function irParaAgendamento({ especialidade = '', medico = '' } = {}) {
  document.dispatchEvent(new CustomEvent('vitalis:preselecionar', { detail: { especialidade, medico } }));
  rolarAte($('#agendar'));
}

/* ---------- 3. CABEÇALHO, PROGRESSO E VOLTAR AO TOPO ---------- */
const topo = $('#topo');
const barraProgresso = $('#progresso');
const botaoTopo = $('#voltar-topo');
let agendado = false;

function aoRolar() {
  const y = window.scrollY;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  topo.classList.toggle('rolou', y > 20);
  barraProgresso.style.transform = `scaleX(${total > 0 ? y / total : 0})`;
  botaoTopo.classList.toggle('visivel', y > 700);
  agendado = false;
}
// requestAnimationFrame evita rodar o cálculo dezenas de vezes por segundo (performance)
window.addEventListener('scroll', () => {
  if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); }
}, { passive: true });
aoRolar();

botaoTopo.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefereMenosMovimento ? 'auto' : 'smooth' }));

/* ---------- 4. MENU DO CELULAR ---------- */
const botaoMenu = $('#btn-menu');
const menu = $('#menu');

function alternarMenu(abrir) {
  const abre = abrir ?? !menu.classList.contains('aberto');
  menu.classList.toggle('aberto', abre);
  document.body.classList.toggle('menu-aberto', abre);
  botaoMenu.setAttribute('aria-expanded', String(abre));
  botaoMenu.setAttribute('aria-label', abre ? 'Fechar menu' : 'Abrir menu');
}

botaoMenu.addEventListener('click', () => alternarMenu());
// Fecha ao clicar num link do menu
$$('a', menu).forEach((link) => link.addEventListener('click', () => alternarMenu(false)));
// Fecha com a tecla Esc
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('aberto')) { alternarMenu(false); botaoMenu.focus(); } });
// Fecha ao clicar fora do menu
document.addEventListener('click', (e) => {
  if (menu.classList.contains('aberto') && !menu.contains(e.target) && !botaoMenu.contains(e.target)) alternarMenu(false);
});
// Se a tela aumentar (girar o tablet, por exemplo), fecha o menu
matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) alternarMenu(false); });

/* ---------- 5. NAVEGAÇÃO SUAVE + LINK ATIVO NO MENU ---------- */
const linksMenu = $$('.menu ul a');
let rolandoPorClique = false; // evita o destaque do menu "pular" durante a rolagem automática
let timerRolagem;

function marcarAtivo(id) {
  linksMenu.forEach((link) => link.classList.toggle('ativo', link.getAttribute('href') === '#' + id));
}

/**
 * Rola até uma seção descontando a altura do cabeçalho fixo.
 * Feito em JavaScript para funcionar igual em todos os navegadores
 * (inclusive quando a seção fica perto do fim da página, como "Contato").
 */
function rolarAte(alvo) {
  const destino = alvo.getBoundingClientRect().top + window.scrollY - topo.offsetHeight - 8;
  rolandoPorClique = true;
  clearTimeout(timerRolagem);
  timerRolagem = setTimeout(() => { rolandoPorClique = false; }, 1200);
  window.scrollTo({ top: Math.max(0, destino), behavior: prefereMenosMovimento ? 'auto' : 'smooth' });
}

// Todos os links internos (#especialidades, #contato, #agendar...) usam a rolagem acima
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href').slice(1);
  const alvo = id ? document.getElementById(id) : null;
  if (!alvo) return;
  e.preventDefault();
  alternarMenu(false);
  if (link.closest('.menu')) marcarAtivo(id);
  rolarAte(alvo);
  history.pushState(null, '', '#' + id); // atualiza o endereço sem "pular"
  // Acessibilidade: leva o foco do teclado para a seção escolhida
  if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
  alvo.focus({ preventScroll: true });
});

const observadorSecoes = new IntersectionObserver((entradas) => {
  if (rolandoPorClique) return;
  entradas.forEach((entrada) => { if (entrada.isIntersecting) marcarAtivo(entrada.target.id); });
}, { rootMargin: '-45% 0px -50% 0px' }); // considera "ativa" a seção que está no meio da tela
linksMenu.forEach((link) => {
  const secao = $(link.getAttribute('href'));
  if (secao) observadorSecoes.observe(secao);
});
// No fim da página a última seção (Contato) nunca chega ao meio da tela: marca na mão
window.addEventListener('scroll', () => {
  if (!rolandoPorClique && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) marcarAtivo('contato');
}, { passive: true });

/* ---------- 6. TEMA CLARO/ESCURO ---------- */
$('#btn-tema').addEventListener('click', () => {
  const raiz = document.documentElement;
  const novo = raiz.dataset.theme === 'dark' ? 'light' : 'dark';
  raiz.dataset.theme = novo;
  try { localStorage.setItem('vitalis-tema', novo); } catch (e) { /* navegação anônima: ignora */ }
  $('meta[name="theme-color"]').content = novo === 'dark' ? '#0A1F27' : '#0E3B4A';
  toast(novo === 'dark' ? 'Tema escuro ativado 🌙' : 'Tema claro ativado ☀️', 1800);
});

/* ---------- 7. ANIMAÇÕES AO ROLAR + CONTADORES ---------- */
// Elementos "irmãos" aparecem em cascata (um pouquinho depois do outro)
$$('.revelar').forEach((el) => {
  const irmaos = [...el.parentElement.children].filter((c) => c.classList.contains('revelar'));
  const posicao = irmaos.indexOf(el);
  if (posicao > 0) el.style.setProperty('--atraso', Math.min(posicao * 0.09, 0.5) + 's');
});

const observadorRevelar = new IntersectionObserver((entradas, obs) => {
  entradas.forEach((entrada) => {
    if (!entrada.isIntersecting) return;
    const el = entrada.target;
    el.classList.add('visivel');
    $$('[data-contador]', el).forEach(animarContador);
    obs.unobserve(el); // anima só uma vez
    // Terminada a entrada, tira a classe "revelar" para os efeitos de hover responderem na hora
    const atraso = parseFloat(el.style.getPropertyValue('--atraso')) || 0;
    setTimeout(() => el.classList.remove('revelar'), 1200 + atraso * 1000);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
$$('.revelar').forEach((el) => observadorRevelar.observe(el));

/** Conta de 0 até o valor de data-alvo com desaceleração suave */
function animarContador(el) {
  if (el.dataset.animado) return;
  el.dataset.animado = '1';
  const alvo = parseFloat(el.dataset.alvo);
  const decimais = parseInt(el.dataset.decimais || '0', 10);
  const sufixo = el.dataset.sufixo || '';
  const formatar = (n) => n.toFixed(decimais).replace('.', ',') + sufixo;

  const duracao = 1600;
  const inicio = performance.now();
  function passo(agora) {
    const t = Math.min((agora - inicio) / duracao, 1);
    const suavizado = 1 - Math.pow(1 - t, 3); // "ease-out"
    el.textContent = formatar(alvo * suavizado);
    if (t < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

/* ---------- 8. PALAVRAS ALTERNANDO NO TÍTULO ---------- */
(function rotador() {
  const palavras = $$('.rotador__palavra');
  if (palavras.length < 2) return;
  let atual = 0;
  setInterval(() => {
    const anterior = palavras[atual];
    atual = (atual + 1) % palavras.length;
    anterior.classList.remove('ativa');
    anterior.classList.add('saindo');
    palavras[atual].classList.add('ativa');
    setTimeout(() => anterior.classList.remove('saindo'), 600);
  }, 3200);
})();

/* ---------- 9. PRÓXIMO HORÁRIO E "ABERTO AGORA" ---------- */
const paraMinutos = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const paraHHMM = (min) => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');

(function horariosDaClinica() {
  const agora = new Date();
  const minAgora = agora.getHours() * 60 + agora.getMinutes();
  const hoje = CONFIG.horarios[agora.getDay()];

  // "Aberto agora" / "Fechado agora"
  const selo = $('#status-aberto');
  const aberto = hoje && minAgora >= paraMinutos(hoje[0]) && minAgora < paraMinutos(hoje[1]);
  selo.textContent = aberto ? '● Aberto agora' : '● Fechado agora';
  selo.classList.add(aberto ? 'sim' : 'nao');

  // Próximo horário livre (estimativa: daqui a pelo menos 1h, arredondado)
  const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  for (let d = 0; d < 8; d++) {
    const dia = new Date(agora);
    dia.setDate(agora.getDate() + d);
    const faixa = CONFIG.horarios[dia.getDay()];
    if (!faixa) continue;
    let minimo = paraMinutos(faixa[0]);
    if (d === 0) {
      const passo = CONFIG.intervaloConsulta;
      minimo = Math.max(minimo, Math.ceil((minAgora + 60) / passo) * passo);
    }
    if (minimo < paraMinutos(faixa[1])) {
      const rotulo = d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : nomesDias[dia.getDay()];
      $('#proximo-horario').textContent = `${rotulo}, ${paraHHMM(minimo)}`;
      break;
    }
  }
})();

/* ---------- 10. ESPECIALIDADES: MODAL "SAIBA MAIS" ---------- */
$$('[data-abrir-detalhes]').forEach((botao) => {
  botao.addEventListener('click', () => {
    const card = botao.closest('.especialidade');
    const nome = card.dataset.especialidade;
    abrirModal({
      titulo: nome,
      icone: card.querySelector('.especialidade__icone').innerHTML,
      corpo: card.querySelector('.card__detalhes').innerHTML,
      acoes: [
        { texto: 'Agendar ' + nome, aoClicar: () => irParaAgendamento({ especialidade: nome }) },
        { texto: 'Ver especialistas', classe: 'btn--contorno', aoClicar: () => { filtrarEquipe(nome); rolarAte($('#equipe')); } },
      ],
    });
  });
});

/* ---------- 11. EQUIPE: FILTROS ---------- */
const cardsMedicos = $$('.medico');
const caixaFiltros = $('#filtros-equipe');
const especialidadesEquipe = ['Todos', ...new Set(cardsMedicos.map((c) => c.dataset.especialidade))];

especialidadesEquipe.forEach((nome) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'filtro';
  b.textContent = nome;
  b.setAttribute('aria-pressed', String(nome === 'Todos'));
  b.addEventListener('click', () => filtrarEquipe(nome));
  caixaFiltros.appendChild(b);
});

function filtrarEquipe(nome) {
  $$('.filtro', caixaFiltros).forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === nome)));
  cardsMedicos.forEach((card, i) => {
    const mostrar = nome === 'Todos' || card.dataset.especialidade === nome;
    card.classList.toggle('escondido', !mostrar);
    card.classList.remove('entrando');
    if (mostrar) {
      card.classList.add('visivel'); // garante que não fique invisível pela animação de rolagem
      void card.offsetWidth;          // "reinicia" a animação
      card.style.animationDelay = (i % 3) * 0.06 + 's';
      card.classList.add('entrando');
    }
  });
}

// Botões "Agendar com..." nos cards da equipe
$$('[data-agendar-medico]').forEach((botao) => {
  botao.addEventListener('click', () => {
    const card = botao.closest('.medico');
    irParaAgendamento({ especialidade: card.dataset.especialidade, medico: card.dataset.id });
  });
});

/* ---------- 12. CARROSSEL DE DEPOIMENTOS ---------- */
(function carrossel() {
  const raiz = $('#carrossel');
  const trilho = $('.carrossel__trilho', raiz);
  const janela = $('.carrossel__janela', raiz);
  const itens = $$('.depo', trilho);
  const caixaPontos = $('.carrossel__pontos', raiz);
  let indice = 0;
  let timerAuto;

  // Quantos depoimentos aparecem por vez (depende da largura da tela)
  const porVez = () => (innerWidth >= 960 ? 3 : innerWidth >= 640 ? 2 : 1);
  const ultimoIndice = () => Math.max(0, itens.length - porVez());

  function montarPontos() {
    caixaPontos.innerHTML = '';
    for (let i = 0; i <= ultimoIndice(); i++) {
      const p = document.createElement('button');
      p.type = 'button';
      p.setAttribute('aria-label', `Ir para o depoimento ${i + 1}`);
      p.addEventListener('click', () => { irPara(i); reiniciarAuto(); });
      caixaPontos.appendChild(p);
    }
  }

  function irPara(i) {
    const max = ultimoIndice();
    indice = i > max ? 0 : i < 0 ? max : i; // volta ao início depois do último
    trilho.style.transform = `translateX(-${indice * (100 / porVez())}%)`;
    $$('button', caixaPontos).forEach((p, n) => p.setAttribute('aria-current', String(n === indice)));
    // Esconde de leitores de tela os depoimentos fora da área visível
    itens.forEach((item, n) => item.setAttribute('aria-hidden', String(n < indice || n >= indice + porVez())));
  }

  function reiniciarAuto() {
    clearInterval(timerAuto);
    if (!prefereMenosMovimento) timerAuto = setInterval(() => irPara(indice + 1), 6000);
  }

  $('[data-carrossel="anterior"]', raiz).addEventListener('click', () => { irPara(indice - 1); reiniciarAuto(); });
  $('[data-carrossel="proximo"]', raiz).addEventListener('click', () => { irPara(indice + 1); reiniciarAuto(); });

  // Pausa quando o mouse está em cima ou quando o usuário foca um controle
  raiz.addEventListener('mouseenter', () => clearInterval(timerAuto));
  raiz.addEventListener('mouseleave', reiniciarAuto);
  raiz.addEventListener('focusin', () => clearInterval(timerAuto));

  // Arrastar com o dedo (celular) ou com o mouse
  let inicioX = null;
  janela.addEventListener('pointerdown', (e) => { inicioX = e.clientX; clearInterval(timerAuto); });
  window.addEventListener('pointerup', (e) => {
    if (inicioX === null) return;
    const diferenca = e.clientX - inicioX;
    if (Math.abs(diferenca) > 45) irPara(indice + (diferenca < 0 ? 1 : -1));
    inicioX = null;
    reiniciarAuto();
  });
  // Teclado: setas esquerda/direita
  raiz.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { irPara(indice + 1); }
    if (e.key === 'ArrowLeft') { irPara(indice - 1); }
  });

  let larguraAnterior = porVez();
  window.addEventListener('resize', () => {
    if (porVez() !== larguraAnterior) { larguraAnterior = porVez(); montarPontos(); irPara(Math.min(indice, ultimoIndice())); }
  });

  montarPontos();
  irPara(0);
  reiniciarAuto();
})();

/* ---------- 13. DÚVIDAS, COPIAR ENDEREÇO E EXTRAS ---------- */
// Acordeão: ao abrir uma pergunta, fecha as outras
$$('.acordeao details').forEach((item, _, todos) => {
  item.addEventListener('toggle', () => {
    if (item.open) todos.forEach((outro) => { if (outro !== item) outro.open = false; });
  });
});

// Copiar endereço para a área de transferência
$('#btn-copiar-endereco').addEventListener('click', async () => {
  const endereco = 'Av. Paulista, 1000 – Bela Vista, São Paulo – SP';
  try {
    await navigator.clipboard.writeText(endereco);
    toast('Endereço copiado! 📍');
  } catch (e) {
    toast(endereco, 5000); // se o navegador bloquear, mostra o endereço para copiar manualmente
  }
});

// Ano atual no rodapé
$('#ano').textContent = new Date().getFullYear();

// Balãozinho "Fale com a gente!" aparece uma vez, alguns segundos depois de abrir o site
setTimeout(() => {
  const botao = $('.whats');
  botao.classList.add('mostrar-dica');
  setTimeout(() => botao.classList.remove('mostrar-dica'), 4000);
}, 5000);

/* ---------- 14. EFEITOS EXTRAS DE ANIMAÇÃO ---------- */

// Onda ao clicar em qualquer botão (feedback visual de "cliquei")
document.addEventListener('pointerdown', (e) => {
  const botao = e.target.closest('.btn');
  if (!botao) return;
  const r = botao.getBoundingClientRect();
  const tamanho = Math.max(r.width, r.height);
  const onda = document.createElement('span');
  onda.className = 'onda-clique';
  onda.style.cssText = `width:${tamanho}px;height:${tamanho}px;left:${e.clientX - r.left - tamanho / 2}px;top:${e.clientY - r.top - tamanho / 2}px`;
  botao.appendChild(onda);
  onda.addEventListener('animationend', () => onda.remove());
});

// Só no computador (mouse) e para quem não pediu menos movimento
const temMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
if (temMouse && !prefereMenosMovimento) {
  // Inclinação 3D dos cards acompanhando o mouse
  $$('.especialidade, .medico').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (card.classList.contains('revelar')) return; // espera a animação de entrada terminar
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 a 0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-8px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  // Efeito de profundidade (parallax) no topo: foto e formas se mexem com o mouse
  const hero = $('.hero');
  const camadas = [
    [$('.hero__foto'), 12], [$('.flutuante--1'), 26], [$('.flutuante--2'), -22],
    [$('.hero__bolha--1'), -40], [$('.hero__bolha--2'), 30],
  ];
  hero.addEventListener('pointermove', (e) => {
    const x = e.clientX / innerWidth - 0.5;
    const y = e.clientY / innerHeight - 0.5;
    camadas.forEach(([el, forca]) => { if (el) el.style.translate = `${(x * forca).toFixed(1)}px ${(y * forca).toFixed(1)}px`; });
  });
  hero.addEventListener('pointerleave', () => camadas.forEach(([el]) => { if (el) el.style.translate = ''; }));
}

/* Deixa algumas funções disponíveis para o agendamento.js */
window.Vitalis = { CONFIG, abrirModal, fecharModal, toast, paraMinutos, paraHHMM };
