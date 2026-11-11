/* =========================================================================
   RAIZ & BARRO — Carrinho de compras (visual, sem pagamento real)
   -------------------------------------------------------------------------
   - Guarda os itens no navegador (localStorage): o carrinho continua lá
     mesmo se a pessoa fechar a página.
   - Calcula subtotal, cupom, frete grátis e total.
   - "Finalizar" monta a lista do pedido e abre o WhatsApp da loja.
   ========================================================================= */

'use strict';

(function carrinho() {
  const { CONFIG, $, moeda, urlFoto, escapar, toast, memoria, menosMovimento } = window.Loja;
  const CHAVE = 'raizbarro-carrinho';

  const painel = $('#carrinho');
  const fundo = $('#fundo-escuro');
  const lista = $('#carrinho-itens');
  const botaoCarrinho = $('#btn-carrinho');
  const contagem = $('#contagem-carrinho');

  // Estado: [{ id, variante, qtd }] e o cupom aplicado
  let itens = memoria.ler(CHAVE, []).filter((i) => PRODUTOS.some((p) => p.id === i.id));
  let cupom = '';

  const produto = (id) => PRODUTOS.find((p) => p.id === id);
  /** Preço de 1 unidade, somando o valor extra do tamanho escolhido */
  function precoUnitario(item) {
    const p = produto(item.id);
    const v = p.variantes?.find((x) => x.nome === item.variante);
    return p.preco + (v ? v.extra : 0);
  }

  function totais() {
    const subtotal = itens.reduce((s, i) => s + precoUnitario(i) * i.qtd, 0);
    const desconto = cupom ? subtotal * (CONFIG.cupons[cupom] / 100) : 0;
    // O frete grátis é calculado pelo subtotal ANTES do cupom,
    // assim aplicar um desconto nunca faz o cliente perder o frete grátis
    const frete = subtotal === 0 || subtotal >= CONFIG.freteGratisAcimaDe ? 0 : CONFIG.valorFrete;
    return { subtotal, desconto, frete, total: subtotal - desconto + frete, falta: Math.max(0, CONFIG.freteGratisAcimaDe - subtotal) };
  }

  /* ---------- Desenho do carrinho ---------- */
  function desenhar() {
    memoria.gravar(CHAVE, itens);
    const qtdTotal = itens.reduce((s, i) => s + i.qtd, 0);

    // Bolinha com o número de itens no ícone da sacola
    contagem.hidden = qtdTotal === 0;
    contagem.textContent = qtdTotal;
    $('#carrinho-qtd').textContent = qtdTotal ? `(${qtdTotal})` : '';
    botaoCarrinho.setAttribute('aria-label', `Abrir carrinho, ${qtdTotal} ${qtdTotal === 1 ? 'item' : 'itens'}`);

    lista.innerHTML = itens.map((i, n) => {
      const p = produto(i.id);
      return `
        <li class="item-carrinho">
          <img src="${urlFoto(p.foto, 160)}" alt="" width="72" height="72">
          <div class="item-carrinho__info">
            <strong>${escapar(p.nome)}</strong>
            ${i.variante ? `<small>Tamanho: ${escapar(i.variante)}</small>` : ''}
            <span>${moeda(precoUnitario(i))}</span>
            <div class="qtd qtd--pequena" role="group" aria-label="Quantidade de ${escapar(p.nome)}">
              <button type="button" data-acao="menos" data-n="${n}" aria-label="Diminuir"><svg class="ic"><use href="#i-menos"/></svg></button>
              <output>${i.qtd}</output>
              <button type="button" data-acao="mais" data-n="${n}" aria-label="Aumentar"><svg class="ic"><use href="#i-mais"/></svg></button>
            </div>
          </div>
          <button class="item-carrinho__remover" type="button" data-acao="remover" data-n="${n}" aria-label="Remover ${escapar(p.nome)}"><svg class="ic"><use href="#i-lixo"/></svg></button>
        </li>`;
    }).join('');

    const vazio = itens.length === 0;
    $('#carrinho-vazio').hidden = !vazio;
    $('#carrinho-rodape').hidden = vazio;
    $('#frete-barra').hidden = vazio;

    const t = totais();
    $('#r-subtotal').textContent = moeda(t.subtotal);
    $('#linha-desconto').hidden = !t.desconto;
    $('#r-desconto').textContent = '− ' + moeda(t.desconto);
    $('#r-frete').textContent = t.frete ? moeda(t.frete) : 'Grátis 🎉';
    $('#r-total').textContent = moeda(t.total);

    // Barra "faltam R$ X para o frete grátis"
    const pct = Math.min(100, (t.subtotal / CONFIG.freteGratisAcimaDe) * 100);
    $('#frete-progresso').style.width = pct + '%';
    $('#frete-texto').innerHTML = t.falta > 0
      ? `Faltam <b>${moeda(t.falta)}</b> para o <b>frete grátis</b>`
      : '🎉 Você ganhou <b>frete grátis</b>!';
    $('#frete-barra').classList.toggle('completo', t.falta === 0);
  }

  // Botões de + / − / remover dentro do carrinho
  lista.addEventListener('click', (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const i = itens[Number(b.dataset.n)];
    if (b.dataset.acao === 'mais') i.qtd = Math.min(20, i.qtd + 1);
    if (b.dataset.acao === 'menos') i.qtd -= 1;
    if (b.dataset.acao === 'remover' || i.qtd <= 0) {
      itens.splice(Number(b.dataset.n), 1);
      toast(`${produto(i.id).nome} removido do carrinho`);
    }
    desenhar();
  });

  /* ---------- Adicionar (usado pela vitrine e pelo topo) ---------- */
  function adicionar(id, variante = '', qtd = 1, origem = null) {
    const p = produto(id);
    if (!p) return;
    if (!variante && p.variantes) variante = p.variantes[0].nome;
    const existente = itens.find((i) => i.id === id && i.variante === variante);
    if (existente) existente.qtd = Math.min(20, existente.qtd + qtd);
    else itens.push({ id, variante, qtd });
    desenhar();
    voarAteSacola(origem, p);
    toast(`${p.nome} adicionado ao carrinho 🪴`);
  }

  /** Animação: a foto do produto "voa" até o ícone da sacola */
  function voarAteSacola(origem, p) {
    const pular = () => { botaoCarrinho.classList.remove('pulou'); void botaoCarrinho.offsetWidth; botaoCarrinho.classList.add('pulou'); };
    if (!origem || menosMovimento) return pular();
    const de = origem.getBoundingClientRect();
    const para = botaoCarrinho.getBoundingClientRect();
    const voo = document.createElement('img');
    voo.src = urlFoto(p.foto, 160);
    voo.className = 'voo';
    voo.style.cssText = `left:${de.left + de.width / 2 - 40}px;top:${de.top + de.height / 2 - 40}px`;
    document.body.appendChild(voo);
    const dx = para.left + para.width / 2 - (de.left + de.width / 2);
    const dy = para.top + para.height / 2 - (de.top + de.height / 2);
    voo.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy - 80}px) scale(.7)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.15)`, opacity: .4 },
    ], { duration: 750, easing: 'cubic-bezier(.5,0,.4,1)' }).onfinish = () => { voo.remove(); pular(); };
  }

  /* ---------- Abrir e fechar o painel ---------- */
  let ultimoFoco = null;
  function abrir() {
    ultimoFoco = document.activeElement;
    painel.classList.add('aberto');
    painel.setAttribute('aria-hidden', 'false');
    fundo.hidden = false;
    requestAnimationFrame(() => fundo.classList.add('visivel'));
    document.body.classList.add('travado');
    setTimeout(() => $('[data-fechar-carrinho]', painel).focus(), 50);
  }
  function fechar() {
    painel.classList.remove('aberto');
    painel.setAttribute('aria-hidden', 'true');
    fundo.classList.remove('visivel');
    setTimeout(() => { fundo.hidden = true; }, 300);
    document.body.classList.remove('travado');
    ultimoFoco?.focus?.();
  }
  botaoCarrinho.addEventListener('click', abrir);
  fundo.addEventListener('click', fechar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && painel.classList.contains('aberto')) fechar(); });
  painel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fechar-carrinho]');
    if (!b) return;
    fechar();
    if (b.hasAttribute('data-ir-vitrine')) window.Loja.rolarAte($('#vitrine'));
  });

  /* ---------- Cupom ---------- */
  $('#form-cupom').addEventListener('submit', (e) => {
    e.preventDefault();
    const campo = $('#cupom');
    const codigo = campo.value.trim().toUpperCase();
    if (CONFIG.cupons[codigo]) {
      cupom = codigo;
      toast(`Cupom ${codigo} aplicado: ${CONFIG.cupons[codigo]}% de desconto ✨`);
      campo.classList.remove('erro');
    } else {
      cupom = '';
      toast('Cupom inválido 😕');
      campo.classList.remove('erro'); void campo.offsetWidth; campo.classList.add('erro');
    }
    desenhar();
  });

  /* ---------- Finalizar pelo WhatsApp ---------- */
  $('#finalizar').addEventListener('click', () => {
    const t = totais();
    const linhas = itens.map((i) => {
      const p = produto(i.id);
      return `• ${i.qtd}x ${p.nome}${i.variante ? ` (${i.variante})` : ''} — ${moeda(precoUnitario(i) * i.qtd)}`;
    });
    const texto =
      `Olá! Quero fazer este pedido na Raiz & Barro 🪴\n\n${linhas.join('\n')}\n\n` +
      `Subtotal: ${moeda(t.subtotal)}\n` +
      (t.desconto ? `Desconto (${cupom}): −${moeda(t.desconto)}\n` : '') +
      `Frete: ${t.frete ? moeda(t.frete) : 'grátis'}\n*Total: ${moeda(t.total)}*`;
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    toast('Pedido pronto no WhatsApp! É só enviar 💬', 4000);
  });

  // Botões "adicionar" fora da vitrine (ex.: produto em destaque no topo)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-adicionar]');
    if (b) adicionar(b.dataset.adicionar, '', 1, b.closest('#hero-produto')?.querySelector('img') || b);
  });

  desenhar();
  window.Loja.carrinho = { adicionar, abrir };
})();
