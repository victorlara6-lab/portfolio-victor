/* =========================================================================
   CUCINA LUME — Cardápio
   -------------------------------------------------------------------------
   Todo o cardápio fica na lista CARDAPIO abaixo. Para mudar um prato, preço
   ou foto, é só editar aqui: a página se monta sozinha a partir destes dados.

   Etiquetas (tags):  'veg' = vegetariano   'picante'   'chef' = sugestão do chef
   foto: código da foto no Unsplash (opcional). Pratos com foto + 'chef'
         aparecem no carrossel "Os mais pedidos".
   ========================================================================= */

'use strict';

const CARDAPIO = [
  {
    categoria: 'Entradas',
    itens: [
      { nome: 'Bruschetta da casa', desc: 'Pão de fermentação natural, tomate italiano, alho e azeite extravirgem.', preco: 32, tags: ['veg'] },
      { nome: 'Burrata com pesto', desc: 'Burrata cremosa, pesto de manjericão e tomate-cereja assado na lenha.', preco: 58, tags: ['veg', 'chef'] },
      { nome: 'Carpaccio clássico', desc: 'Lâminas finas de filé, alcaparras, rúcula e lascas de parmesão.', preco: 49, tags: [] },
      { nome: 'Polpettine al sugo', desc: 'Almôndegas da nonna no molho de tomate, com pão para molhar.', preco: 42, tags: [] },
    ],
  },
  {
    categoria: 'Massas',
    itens: [
      { nome: 'Spaghetti ai gamberi', desc: 'Camarões salteados, tomate-cereja, alho e pimenta calabresa.', preco: 89, tags: ['chef', 'picante'], foto: '1563379926898-05f4575a45d8' },
      { nome: 'Tagliatelle al ragù', desc: 'Massa fresca com ragù de carne cozido lentamente por 6 horas.', preco: 74, tags: ['chef'], foto: '1551183053-bf91a1d81141' },
      { nome: 'Spaghetti alle vongole', desc: 'Vôngoles frescos, vinho branco, alho e salsinha.', preco: 92, tags: ['chef'], foto: '1595295333158-4742f28fbd85' },
      { nome: 'Spaghetti alla carbonara', desc: 'Guanciale crocante, gema, pecorino romano e pimenta-do-reino.', preco: 69, tags: [] },
      { nome: "Penne all'arrabbiata", desc: 'Molho de tomate picante com alho e salsinha.', preco: 54, tags: ['veg', 'picante'], foto: '1621996346565-e3dbc646d9a9' },
      { nome: 'Farfalle ao pesto', desc: 'Pesto de manjericão, pinoli, parmesão e tomate-cereja.', preco: 58, tags: ['veg'], foto: '1473093295043-cdd812d0e601' },
      { nome: 'Spaghetti à bolonhesa', desc: 'O clássico da casa, com molho de carne e tomate.', preco: 59, tags: [], foto: '1572441713132-c542fc4fe282' },
    ],
  },
  {
    categoria: 'Pizzas',
    itens: [
      { nome: 'Margherita', desc: 'Tomate pelado, mozzarella fior di latte, manjericão e azeite.', preco: 62, tags: ['veg', 'chef'], foto: '1574071318508-1cdbab80d002' },
      { nome: 'Calabresa da casa', desc: 'Calabresa artesanal, cebola roxa, azeitonas e orégano.', preco: 66, tags: ['picante'] },
      { nome: 'Quattro formaggi', desc: 'Mozzarella, gorgonzola, parmesão e provolone defumado.', preco: 72, tags: ['veg'] },
      { nome: 'Parma e rúcula', desc: 'Presunto de Parma, rúcula fresca e lascas de grana padano.', preco: 79, tags: [] },
    ],
  },
  {
    categoria: 'Principais',
    itens: [
      { nome: 'Tagliata di manzo', desc: 'Contrafilé grelhado fatiado, batatas rústicas e rúcula.', preco: 98, tags: ['chef'], foto: '1600891964092-4316c288032e' },
      { nome: 'Costela na lenha', desc: 'Costela suína assada lentamente, glaceada com molho da casa.', preco: 89, tags: [] },
      { nome: 'Risoto de cogumelos', desc: 'Funghi secchi, shiitake fresco e parmesão.', preco: 76, tags: ['veg'] },
      { nome: 'Salmão grelhado', desc: 'Com legumes da estação e molho de limão-siciliano.', preco: 94, tags: [] },
    ],
  },
  {
    categoria: 'Sobremesas',
    itens: [
      { nome: 'Panna cotta', desc: 'Creme de baunilha com calda de frutas vermelhas.', preco: 29, tags: ['veg', 'chef'], foto: '1488477181946-6428a0291777' },
      { nome: 'Tiramisù da nonna', desc: 'Biscoito embebido em café, creme de mascarpone e cacau.', preco: 32, tags: ['veg'] },
      { nome: 'Cannoli siciliano', desc: 'Massa crocante recheada com ricota doce e pistache.', preco: 28, tags: ['veg'] },
    ],
  },
  {
    categoria: 'Bebidas',
    itens: [
      { nome: 'Negroni da casa', desc: 'Gim, vermute rosso e bitter, com casca de laranja.', preco: 38, tags: [] },
      { nome: 'Old fashioned', desc: 'Bourbon, açúcar demerara e bitters aromáticos.', preco: 42, tags: [] },
      { nome: 'Taça de vinho tinto', desc: 'Pergunte pela sugestão do dia.', preco: 36, tags: ['veg'] },
      { nome: 'Limonada siciliana', desc: 'Feita na hora, com ou sem açúcar.', preco: 16, tags: ['veg'] },
      { nome: 'Água ou refrigerante', desc: 'Lata ou garrafa 350 ml.', preco: 8, tags: ['veg'] },
    ],
  },
];

/* Prato do dia: um para cada dia da semana (0 = domingo ... 6 = sábado) */
const PRATO_DO_DIA = [
  { nome: 'Lasanha da nonna', desc: 'Camadas de massa fresca, ragù e bechamel. Só aos domingos!', preco: 64 },
  { nome: 'Hoje estamos fechados', desc: 'Às segundas a cozinha descansa. Volte amanhã!', preco: null },
  { nome: 'Gnocchi ao sugo', desc: 'Nhoque de batata feito na hora com molho de tomate fresco.', preco: 52 },
  { nome: 'Risoto de limão-siciliano', desc: 'Cremoso, com raspas de limão e camarões grelhados.', preco: 79 },
  { nome: 'Ravioli de abóbora', desc: 'Recheio de abóbora assada com manteiga de sálvia.', preco: 61 },
  { nome: 'Pizza do pizzaiolo', desc: 'Sabor surpresa criado pelo nosso pizzaiolo. Pergunte ao garçom!', preco: 68 },
  { nome: 'Polvo na brasa', desc: 'Com batatas ao murro e azeite de ervas.', preco: 112 },
];

(function cardapio() {
  const { toast, prepararRevelar, iniciarTrilho } = window.Lume;
  const $ = (s, r = document) => r.querySelector(s);

  const abas = $('#abas-cardapio');
  const lista = $('#lista-cardapio');
  const busca = $('#busca-prato');
  const soVeg = $('#so-vegetariano');
  const vazio = $('#cardapio-vazio');
  let categoriaAtual = CARDAPIO[0].categoria;

  const preco = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
  const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Remove acentos para a busca achar "nhoque" mesmo digitando "nhóque", por exemplo
  const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const ICONES = {
    veg: '<span class="selo selo--veg" title="Vegetariano"><svg class="ic"><use href="#i-folha"/></svg></span>',
    picante: '<span class="selo selo--picante" title="Picante"><svg class="ic"><use href="#i-pimenta"/></svg></span>',
    chef: '<span class="selo selo--chef" title="Sugestão do chef"><svg class="ic"><use href="#i-chef"/></svg></span>',
  };

  /* ---------- Abas das categorias ---------- */
  CARDAPIO.forEach(({ categoria }, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'aba';
    b.textContent = categoria;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(i === 0));
    b.tabIndex = i === 0 ? 0 : -1;
    b.addEventListener('click', () => trocarCategoria(categoria));
    abas.appendChild(b);
  });
  // Teclado: setas trocam de aba (padrão de acessibilidade para abas)
  abas.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const botoes = [...abas.children];
    const i = botoes.indexOf(document.activeElement);
    const novo = botoes[(i + (e.key === 'ArrowRight' ? 1 : -1) + botoes.length) % botoes.length];
    novo.focus();
    novo.click();
  });

  function trocarCategoria(nome) {
    categoriaAtual = nome;
    [...abas.children].forEach((b) => {
      const sel = b.textContent === nome;
      b.setAttribute('aria-selected', String(sel));
      b.tabIndex = sel ? 0 : -1;
    });
    if (busca.value) busca.value = ''; // trocar de aba limpa a busca
    desenhar();
  }

  /* ---------- Lista de pratos ---------- */
  function desenhar() {
    const termo = normalizar(busca.value.trim());
    // Com busca: procura em TODAS as categorias. Sem busca: só na aba atual.
    let itens = termo
      ? CARDAPIO.flatMap((c) => c.itens)
      : CARDAPIO.find((c) => c.categoria === categoriaAtual).itens;
    if (termo) itens = itens.filter((p) => normalizar(p.nome + ' ' + p.desc).includes(termo));
    if (soVeg.checked) itens = itens.filter((p) => p.tags.includes('veg'));

    lista.innerHTML = itens.map((p, i) => `
      <article class="item" style="animation-delay:${i * 0.04}s">
        <div class="item__topo">
          <h3 class="item__nome">${destacar(p.nome, termo)} ${p.tags.map((t) => ICONES[t] || '').join('')}</h3>
          <span class="item__pontos" aria-hidden="true"></span>
          <span class="item__preco">${preco(p.preco)}</span>
        </div>
        <p class="item__desc">${destacar(p.desc, termo)}</p>
      </article>`).join('');
    vazio.hidden = itens.length > 0;
  }

  /** Marca em amarelo o trecho buscado (sem quebrar acentos) */
  function destacar(texto, termo) {
    if (!termo) return escapar(texto);
    const pos = normalizar(texto).indexOf(termo);
    if (pos < 0) return escapar(texto);
    return escapar(texto.slice(0, pos)) + '<mark>' + escapar(texto.slice(pos, pos + termo.length)) + '</mark>' + escapar(texto.slice(pos + termo.length));
  }

  busca.addEventListener('input', desenhar);
  soVeg.addEventListener('change', () => {
    desenhar();
    toast(soVeg.checked ? 'Mostrando só pratos vegetarianos 🌿' : 'Mostrando todos os pratos', 1800);
  });
  desenhar();

  /* ---------- Carrossel "Os mais pedidos" ---------- */
  const trilho = $('#trilho-chef');
  const destaques = CARDAPIO.flatMap((c) => c.itens).filter((p) => p.foto && p.tags.includes('chef'));
  trilho.innerHTML = destaques.map((p) => `
    <article class="prato-card revelar">
      <div class="prato-card__foto">
        <img src="https://images.unsplash.com/photo-${p.foto}?w=640&q=65&auto=format&fit=crop" loading="lazy" alt="${escapar(p.nome)}" draggable="false">
        <span class="prato-card__preco">${preco(p.preco)}</span>
      </div>
      <div class="prato-card__info"><h3>${escapar(p.nome)}</h3><p>${escapar(p.desc)}</p></div>
    </article>`).join('');
  prepararRevelar([...trilho.children]);
  iniciarTrilho(trilho);

  /* ---------- Prato do dia ---------- */
  const hoje = PRATO_DO_DIA[new Date().getDay()];
  $('#prato-dia-nome').textContent = hoje.nome;
  $('#prato-dia-desc').textContent = hoje.desc;
  $('#prato-dia-preco').textContent = hoje.preco ? preco(hoje.preco) : '';
})();
