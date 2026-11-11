# Raiz & Barro — Loja virtual

> **Projeto de portfólio de Victor.** A Raiz & Barro é uma loja **fictícia**: produtos, preços e cupons são de demonstração. **Nenhum pagamento é feito no site.**

Loja de plantas e cerâmica feita com **HTML, CSS e JavaScript puros** (sem frameworks). Funciona no celular, tablet e computador.

## Funcionalidades
- **Vitrine** montada a partir de uma lista de produtos, com filtros por categoria, **busca** (ignora acentos) e **ordenação** por preço ou nome
- Selos automáticos: **% de desconto**, "Novo", "Mais vendido" e "Fácil de cuidar"
- **Favoritos** (♥) salvos no navegador, com contador no topo
- **Visualização rápida**: foto grande, dicas de luz e rega, escolha de **tamanho** (com preço extra) e quantidade
- **Carrinho lateral**:
  - quantidade, remover item e itens salvos mesmo fechando a página
  - barra de progresso "faltam R$ X para o **frete grátis**"
  - **cupom de desconto** (teste: `BEMVINDO10`)
  - **finalizar pelo WhatsApp** com o pedido completo já escrito
- Animação do produto "voando" até a sacola ao adicionar

## Organização
```
loja/
├── index.html
└── assets/
    ├── css/style.css
    ├── js/
    │   ├── produtos.js   ← TODOS os produtos, preços e categorias
    │   ├── main.js       ← configuração (WhatsApp, frete, cupons), menu, animações
    │   ├── carrinho.js   ← carrinho, cupom, frete e pedido
    │   └── vitrine.js    ← cards, filtros, busca, favoritos e janela do produto
    └── img/  logo.svg, favicon.svg
```

## Como adaptar para uma loja real
1. **Produtos:** edite a lista `PRODUTOS` em `assets/js/produtos.js`.
2. **WhatsApp, frete grátis e cupons:** `CONFIG` no topo de `assets/js/main.js`.
3. **Cores e fontes:** variáveis no topo de `assets/css/style.css`.
4. **Pagamento online de verdade:** o próximo passo seria integrar uma plataforma de pagamento (ex.: link de pagamento ou checkout de um gateway). Neste projeto de portfólio, o pedido é fechado pelo WhatsApp.

---
*Site demonstrativo — projeto de portfólio de Victor.* Fotos: [Unsplash](https://unsplash.com) (licença gratuita).
