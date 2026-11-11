/* =========================================================================
   RAIZ & BARRO — Vitrine de produtos
   -------------------------------------------------------------------------
   - Monta os cards a partir de PRODUTOS (produtos.js)
   - Filtros por categoria e favoritos, busca e ordenação
   - Favoritar (coração) — fica salvo no navegador
   - Visualização rápida com tamanho, quantidade e dicas de cuidado
   ========================================================================= */

'use strict';

(function vitrine() {
  const { $, $$, moeda, urlFoto, escapar, toast, memoria, rolarAte } = window.Loja;
  const { adicionar, abrir: abrirCarrinho } = window.Loja.carrinho;

  const grade = $('#produtos');
  const filtros = $('#filtros');
  const busca = $('#busca');
  const ordenar = $('#ordenar');
  const vazio = $('#vazio');
  const CHAVE_FAV = 'raizbarro-favoritos';

  let filtroAtual = 'todos';
  let favoritos = new Set(memoria.ler(CHAVE_FAV, []));

  const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const desconto = (p) => (p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) : 0);

  /* ---------- Quantidade por categoria (aparece nos cards de categoria) ---------- */
  Object.keys(CATEGORIAS).forEach((c) => {
    const el = $('#qtd-' + c);
    if (el) el.textContent = `${PRODUTOS.filter((p) => p.categoria === c).length} itens`;
  });

  /* ---------- Botões de filtro ---------- */
  const opcoes = [['todos', 'Todos'], ...Object.entries(CATEGORIAS), ['favoritos', '♥ Favoritos']];
  opcoes.forEach(([valor, rotulo]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'filtro';
    b.dataset.filtro = valor;
    b.textContent = rotulo;
    b.setAttribute('aria-pressed', String(valor === 'todos'));
    b.addEventListener('click', () => filtrar(valor));
    filtros.appendChild(b);
  });

  function filtrar(valor) {
    filtroAtual = valor;
    $$('.filtro', filtros).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === valor)));
    desenhar();
  }

  // Cards de categoria e o coração do topo levam até a vitrine já filtrada
  $$('[data-categoria]').forEach((c) => c.addEventListener('click', () => { filtrar(c.dataset.categoria); rolarAte($('#vitrine')); }));
  $('#btn-favoritos').addEventListener('click', () => {
    filtrar('favoritos');
    rolarAte($('#vitrine'));
    if (!favoritos.size) toast('Toque no ♥ dos produtos para salvar seus favoritos');
  });
  $('#limpar-filtros').addEventListener('click', () => { busca.value = ''; ordenar.value = 'relevancia'; filtrar('todos'); });
  busca.addEventListener('input', desenhar);
  ordenar.addEventListener('change', desenhar);

  /* ---------- Cards ---------- */
  function desenhar() {
    const termo = normalizar(busca.value.trim());
    let lista = PRODUTOS.filter((p) =>
      (filtroAtual === 'todos' || p.categoria === filtroAtual || (filtroAtual === 'favoritos' && favoritos.has(p.id))) &&
      (!termo || normalizar(`${p.nome} ${p.desc} ${CATEGORIAS[p.categoria]}`).includes(termo)));

    if (ordenar.value === 'menor') lista = [...lista].sort((a, b) => a.preco - b.preco);
    if (ordenar.value === 'maior') lista = [...lista].sort((a, b) => b.preco - a.preco);
    if (ordenar.value === 'nome') lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    grade.innerHTML = lista.map((p, i) => `
      <article class="produto" style="animation-delay:${Math.min(i * 0.05, 0.4)}s" data-id="${p.id}">
        <div class="produto__foto">
          <button class="produto__abrir" type="button" data-ver="${p.id}" aria-label="Ver detalhes de ${escapar(p.nome)}">
            <img src="${urlFoto(p.foto, 500)}" loading="lazy" alt="${escapar(p.nome)}" width="500" height="500">
          </button>
          <div class="produto__selos">
            ${desconto(p) ? `<span class="selo selo--desconto">-${desconto(p)}%</span>` : ''}
            ${p.selo ? `<span class="selo selo--${p.selo}">${SELOS[p.selo]}</span>` : ''}
          </div>
          <button class="favorito ${favoritos.has(p.id) ? 'ativo' : ''}" type="button" data-favoritar="${p.id}"
                  aria-pressed="${favoritos.has(p.id)}" aria-label="Favoritar ${escapar(p.nome)}">
            <svg class="ic"><use href="#i-coracao"/></svg>
          </button>
          <button class="produto__rapido" type="button" data-ver="${p.id}" tabindex="-1" aria-hidden="true"><svg class="ic"><use href="#i-olho"/></svg> Ver rápido</button>
        </div>
        <div class="produto__info">
          <small>${CATEGORIAS[p.categoria]}</small>
          <h3><button type="button" data-ver="${p.id}">${escapar(p.nome)}</button></h3>
          <p class="produto__preco">${p.variantes ? '<span class="a-partir">a partir de</span> ' : ''}<b>${moeda(p.preco)}</b>${p.precoAntigo ? ` <s>${moeda(p.precoAntigo)}</s>` : ''}</p>
          <p class="produto__parcela">ou 3x de ${moeda(p.preco / 3)}</p>
        </div>
        <button class="btn btn--azul btn--bloco produto__comprar" type="button" data-comprar="${p.id}">
          <svg class="ic"><use href="#i-sacola"/></svg> Adicionar
        </button>
      </article>`).join('');

    vazio.hidden = lista.length > 0;
    if (filtroAtual === 'favoritos' && !favoritos.size) $('p', vazio).textContent = 'Você ainda não favoritou nada. Toque no ♥ dos produtos!';
    else $('p', vazio).textContent = 'Nenhum produto encontrado 🌵';
    $('#contagem-produtos').textContent = `${lista.length} ${lista.length === 1 ? 'produto' : 'produtos'}`;
    atualizarContagemFavoritos();
  }

  /* ---------- Cliques na grade: comprar, favoritar e ver detalhes ---------- */
  grade.addEventListener('click', (e) => {
    const comprar = e.target.closest('[data-comprar]');
    const fav = e.target.closest('[data-favoritar]');
    const ver = e.target.closest('[data-ver]');

    if (comprar) {
      const card = comprar.closest('.produto');
      adicionar(comprar.dataset.comprar, '', 1, $('img', card));
      comprar.classList.add('ok');
      comprar.innerHTML = '<svg class="ic"><use href="#i-check"/></svg> Adicionado';
      setTimeout(() => { comprar.classList.remove('ok'); comprar.innerHTML = '<svg class="ic"><use href="#i-sacola"/></svg> Adicionar'; }, 1400);
    } else if (fav) {
      alternarFavorito(fav.dataset.favoritar, fav);
    } else if (ver) {
      abrirModal(ver.dataset.ver);
    }
  });

  function alternarFavorito(id, botao) {
    const p = PRODUTOS.find((x) => x.id === id);
    if (favoritos.has(id)) { favoritos.delete(id); toast(`${p.nome} saiu dos favoritos`); }
    else { favoritos.add(id); toast(`${p.nome} salvo nos favoritos ♥`); }
    memoria.gravar(CHAVE_FAV, [...favoritos]);
    if (botao) {
      botao.classList.toggle('ativo', favoritos.has(id));
      botao.setAttribute('aria-pressed', String(favoritos.has(id)));
      botao.classList.remove('pulsou'); void botao.offsetWidth; botao.classList.add('pulsou');
    }
    if (filtroAtual === 'favoritos') desenhar();
    atualizarContagemFavoritos();
  }

  function atualizarContagemFavoritos() {
    const el = $('#contagem-favoritos');
    el.hidden = favoritos.size === 0;
    el.textContent = favoritos.size;
  }

  /* ---------- Visualização rápida (modal) ---------- */
  const modal = $('#modal-produto');
  let produtoModal = null;
  let qtdModal = 1;
  let varianteModal = '';

  function abrirModal(id) {
    const p = PRODUTOS.find((x) => x.id === id);
    produtoModal = p;
    qtdModal = 1;
    varianteModal = p.variantes ? p.variantes[0].nome : '';
    $('#mp-foto').src = urlFoto(p.foto, 800);
    $('#mp-foto').alt = p.nome;
    $('#mp-categoria').textContent = CATEGORIAS[p.categoria];
    $('#mp-nome').textContent = p.nome;
    $('#mp-desc').textContent = p.desc;
    $('#mp-preco-antigo').textContent = p.precoAntigo ? moeda(p.precoAntigo) : '';
    $('#mp-cuidados').innerHTML = p.luz
      ? `<li><svg class="ic"><use href="#i-sol"/></svg><span><small>Luz</small>${escapar(p.luz)}</span></li>
         <li><svg class="ic"><use href="#i-gota"/></svg><span><small>Rega</small>${escapar(p.agua)}</span></li>`
      : '';
    $('#mp-variantes').hidden = !p.variantes;
    $('#mp-opcoes').innerHTML = (p.variantes || []).map((v, i) => `
      <label><input type="radio" name="variante" value="${escapar(v.nome)}" ${i === 0 ? 'checked' : ''}>
      <span>${escapar(v.nome)}${v.extra ? ` <small>+${moeda(v.extra)}</small>` : ''}</span></label>`).join('');
    atualizarModal();
    modal.showModal();
  }

  function atualizarModal() {
    const v = produtoModal.variantes?.find((x) => x.nome === varianteModal);
    const unit = produtoModal.preco + (v ? v.extra : 0);
    $('#mp-preco').textContent = moeda(unit * qtdModal);
    $('#mp-qtd').textContent = qtdModal;
    $('[data-mp-qtd="-1"]').disabled = qtdModal <= 1;
  }

  $('#mp-opcoes').addEventListener('change', (e) => { varianteModal = e.target.value; atualizarModal(); });
  $$('[data-mp-qtd]').forEach((b) => b.addEventListener('click', () => {
    qtdModal = Math.min(20, Math.max(1, qtdModal + Number(b.dataset.mpQtd)));
    atualizarModal();
  }));
  $('#mp-adicionar').addEventListener('click', () => {
    adicionar(produtoModal.id, varianteModal, qtdModal, $('#mp-foto'));
    modal.close();
    setTimeout(abrirCarrinho, 800); // abre o carrinho depois da animação
  });
  $('[data-fechar-modal]', modal).addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

  desenhar(); // os cards têm animação de entrada própria (CSS), por isso não usam o "revelar"
})();
