# Cucina Lume — Site de restaurante

> **Projeto de portfólio de Victor.** A Cucina Lume é um restaurante **fictício**: nomes, pratos, preços e depoimentos são inventados para demonstração.

Site para trattoria italiana, feito com **HTML, CSS e JavaScript puros** (sem frameworks). Funciona no celular, tablet e computador.

## Funcionalidades
- **Cardápio interativo**: abas por categoria, busca por prato ou ingrediente (ignora acentos e destaca o trecho encontrado) e filtro "só vegetarianos"
- **Prato do dia** que muda sozinho conforme o dia da semana
- **"Aberto agora / Fechado"** calculado pelo horário real, com a tabela da semana destacando o dia de hoje
- Carrossel **"Os mais pedidos"** (arrastar com o mouse ou o dedo, setas e teclado)
- **Galeria** que abre em tela cheia (setas, teclado e deslizar no celular)
- **Reserva de mesa**: escolhe o dia (bloqueia dias fechados), horários de almoço e jantar, número de pessoas e ocasião. A mensagem chega pronta no WhatsApp
- Menu de celular com animação circular, animações ao rolar e mapa gratuito (OpenStreetMap)

## Organização
```
restaurante/
├── index.html
└── assets/
    ├── css/style.css
    ├── js/
    │   ├── main.js       ← menu, animações, horários, galeria, carrossel
    │   ├── cardapio.js   ← TODOS os pratos e preços ficam aqui
    │   └── reserva.js    ← formulário de reserva
    └── img/  logo.svg, favicon.svg
```

## Como adaptar para um restaurante real
1. **WhatsApp e horários:** topo do `assets/js/main.js` (`CONFIG`).
2. **Pratos e preços:** lista `CARDAPIO` em `assets/js/cardapio.js`. A página se monta sozinha.
3. **Prato do dia:** lista `PRATO_DO_DIA` no mesmo arquivo (um por dia da semana).
4. **Cores e fontes:** variáveis no topo de `assets/css/style.css`.
5. **Fotos:** troque os links do Unsplash pelas fotos do restaurante.

---
*Site demonstrativo — projeto de portfólio de Victor.* Fotos: [Unsplash](https://unsplash.com) (licença gratuita).
