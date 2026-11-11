/* =========================================================================
   RAIZ & BARRO — Catálogo de produtos
   -------------------------------------------------------------------------
   Para adicionar, remover ou mudar um produto, edite só esta lista.
   A vitrine, os filtros, a busca e o carrinho se ajustam sozinhos.

   Campos:
     id          identificador único (sem espaço nem acento)
     nome, desc  textos do produto
     categoria   'plantas' | 'vasos' | 'mesa' | 'cuidados'
     preco       preço em reais (número)
     precoAntigo preço "de" para mostrar desconto (opcional)
     foto        código da foto no Unsplash
     selo        'novo' | 'mais-vendido' | 'facil' (opcional)
     luz, agua   dicas de cuidado (só para plantas)
     variantes   tamanhos com valor extra (opcional)
   ========================================================================= */

'use strict';

const CATEGORIAS = {
  plantas: 'Plantas',
  vasos: 'Vasos',
  mesa: 'Mesa posta',
  cuidados: 'Cuidados',
};

const PRODUTOS = [
  {
    id: 'costela-de-adao', nome: 'Costela-de-adão', categoria: 'plantas',
    preco: 149, precoAntigo: 179, foto: '1614594975525-e45190c55d0b', selo: 'mais-vendido',
    desc: 'A queridinha das salas. Folhas recortadas enormes que crescem rápido em ambientes iluminados.',
    luz: 'Luz indireta', agua: '1x por semana',
    variantes: [{ nome: 'Média', extra: 0 }, { nome: 'Grande', extra: 60 }],
  },
  {
    id: 'ficus-lyrata', nome: 'Fícus lyrata', categoria: 'plantas',
    preco: 189, foto: '1453904300235-0f2f60b15b5d', selo: 'novo',
    desc: 'Folhas em formato de violino que deixam qualquer canto com cara de revista de decoração.',
    luz: 'Muita luz', agua: '1x por semana',
    variantes: [{ nome: 'Média', extra: 0 }, { nome: 'Grande', extra: 80 }],
  },
  {
    id: 'espada-sao-jorge', nome: 'Espada-de-são-jorge', categoria: 'plantas',
    preco: 89, foto: '1593482892290-f54927ae1bb6', selo: 'facil',
    desc: 'Praticamente indestrutível: aguenta pouca luz e esquecimentos de rega. Ótima para quem está começando.',
    luz: 'Meia-sombra', agua: 'A cada 15 dias',
  },
  {
    id: 'jiboia', nome: 'Jiboia pendente', categoria: 'plantas',
    preco: 79, foto: '1600411833196-7c1f6b1a8b90', selo: 'facil',
    desc: 'Vem no cachepô suspenso. Cresce em cascata e fica linda em prateleiras altas.',
    luz: 'Meia-sombra', agua: '2x por semana',
  },
  {
    id: 'bonsai-ginseng', nome: 'Bonsai ginseng', categoria: 'plantas',
    preco: 129, foto: '1512428813834-c702c7702b78',
    desc: 'Tronco esculpido e copa delicada. Um pequeno jardim zen para a sua mesa de trabalho.',
    luz: 'Luz indireta', agua: '3x por semana',
  },
  {
    id: 'buxinho', nome: 'Buxinho topiaria', categoria: 'plantas',
    preco: 159, foto: '1520412099551-62b6bafeb5bb',
    desc: 'Clássico e elegante, com copa arredondada. Perfeito para varandas e entradas.',
    luz: 'Sol pleno', agua: '2x por semana',
  },
  {
    id: 'cacto-mini', nome: 'Cacto mini + vaso laranja', categoria: 'plantas',
    preco: 39, foto: '1459411552884-841db9b3cc2a', selo: 'mais-vendido',
    desc: 'Pequeno, alegre e quase sem manutenção. Vem no vaso laranja que combina com tudo.',
    luz: 'Sol pleno', agua: 'A cada 15 dias',
  },
  {
    id: 'haworthia', nome: 'Haworthia + vaso menta', categoria: 'plantas',
    preco: 49, foto: '1485955900006-10f4d324d411', selo: 'facil',
    desc: 'Suculenta listrada no vaso cor de menta. Ótima opção de presente.',
    luz: 'Luz indireta', agua: '1x por semana',
  },
  {
    id: 'aloe-cimento', nome: 'Aloe + vaso de cimento', categoria: 'plantas',
    preco: 59, foto: '1509423350716-97f9360b4e09',
    desc: 'Aloe aristata em vaso de cimento feito à mão, com acabamento rústico.',
    luz: 'Sol pleno', agua: 'A cada 10 dias',
  },
  {
    id: 'vaso-anfora', nome: 'Vaso Ânfora', categoria: 'vasos',
    preco: 119, foto: '1612196808214-b8e1d6145a8c',
    desc: 'Cerâmica fosca off-white com formato clássico. Fica lindo vazio ou com galhos secos.',
    variantes: [{ nome: 'P', extra: 0 }, { nome: 'M', extra: 40 }],
  },
  {
    id: 'vaso-gota', nome: 'Vaso Gota', categoria: 'vasos',
    preco: 69, foto: '1581783342308-f792dbdd27c5', selo: 'novo',
    desc: 'Linhas suaves e esmalte acetinado. Ideal para um raminho de eucalipto.',
  },
  {
    id: 'trio-garrafas', nome: 'Trio de vasos garrafa', categoria: 'vasos',
    preco: 139, precoAntigo: 159, foto: '1565193566173-7a0ee3dbe261',
    desc: 'Três vasos de concreto em alturas diferentes, para compor na estante ou na mesa.',
  },
  {
    id: 'copos-ceramica', nome: 'Kit 4 copos de cerâmica', categoria: 'mesa',
    preco: 129, foto: '1610701596007-11502861dcfa',
    desc: 'Copos torneados à mão com esmalte duas cores. Cada peça é única.',
  },
  {
    id: 'caneca-nuvem', nome: 'Caneca Nuvem', categoria: 'mesa',
    preco: 45, foto: '1514228742587-6b1558fcca3d', selo: 'mais-vendido',
    desc: 'Caneca branca de 300 ml, pesadinha e confortável de segurar. Vai ao micro-ondas.',
  },
  {
    id: 'pratos-nevoa', nome: 'Pratos azul-névoa (4 un.)', categoria: 'mesa',
    preco: 189, precoAntigo: 219, foto: '1578749556568-bc2c40e68b61',
    desc: 'Pratos rasos com bordas irregulares e esmalte azul que lembra o céu de inverno.',
  },
  {
    id: 'kit-jardinagem', nome: 'Kit jardinagem', categoria: 'cuidados',
    preco: 59, foto: '1416879595882-3373a0480b5b',
    desc: 'Pazinha, ancinho e tesoura de poda para cuidar das suas plantas com facilidade.',
  },
];

const SELOS = {
  novo: 'Novo',
  'mais-vendido': 'Mais vendido',
  facil: 'Fácil de cuidar',
};
