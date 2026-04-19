/**
 * Conteúdo editável centralizado — textos, marca, planos, FAQ, depoimentos.
 * Altere aqui para personalizar o site sem caçar strings nos componentes.
 *
 * Hero (banner principal da home): edite apenas `src/data/heroBanners.js`.
 */

export const brand = {
  name: 'BailaFit Dance',
  /** Logo: ficheiro em public/imagens/ */
  logoUrl: '/imagens/logo-bailafit-dance.svg',
  tagline: 'Área de membros · dança e fitness em streaming',
};

/** Seção da home (campo «Seção especial» no admin) — valores internos usados em URLs /Browse?section= */
export const highlightSectionDestaques = 'destaques';
export const highlightSectionMaisAssistidos = 'mais_assistidos';
export const highlightSectionSagasCompletas = 'sagas_completas';
export const sectionTitleSagasCompletas = '🎬 Sagas Completas';

/** Valor sentinela no <Select> do admin (Radix não aceita value vazio em todos os itens). */
export const HOME_SECTION_SELECT_NONE = '__none__';

export const subscriptionPlans = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 'R$ 19,90',
    priceValue: 1990,
    period: '/mês',
    iconKey: 'Zap',
    color: 'border-neon-cyan/70 shadow-[0_0_24px_-8px_rgba(34,211,238,0.5)]',
    badge: null,
    features: [
      'Acesso a todo o catálogo',
      'Qualidade HD',
      'Múltiplos perfis',
      'Sem anúncios',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 29,90',
    priceValue: 2990,
    period: '/mês',
    iconKey: 'Star',
    color: 'border-neon-fuchsia/80 shadow-[0_0_28px_-6px_rgba(232,121,249,0.55)]',
    badge: 'Mais Popular',
    features: [
      'Tudo do plano Mensal',
      'Qualidade Full HD',
      'Downloads offline',
      'Acesso antecipado a lançamentos',
      'Suporte prioritário',
    ],
  },
  {
    id: 'anual',
    name: 'Anual',
    price: 'R$ 199,00',
    priceValue: 19900,
    period: '/ano',
    iconKey: 'Crown',
    color: 'border-neon-lime/75 shadow-[0_0_24px_-8px_rgba(74,222,128,0.45)]',
    badge: 'Melhor Custo-Benefício',
    features: [
      'Tudo do plano Premium',
      '2 meses grátis',
      'Qualidade 4K',
      'Acesso vitalício ao histórico',
    ],
  },
];

export const subscriptionPage = {
  titleHtml: ['BailaFit', ' Dance', ' Premium'],
  subtitle: 'Escolha o plano ideal para você',
  paymentNote:
    'Modo local: nenhum pagamento real. Em produção, costuma-se usar PIX/cartão via gateway — aqui é apenas demonstração.',
};

export const demoMessages = {
  checkoutDisabled:
    'Checkout desativado no modo demonstração. Nenhum pagamento real será processado.',
  checkoutSimulateHint:
    'Use o botão abaixo apenas para testar a tela de assinatura com dados fictícios no navegador.',
};

export const footer = {
  copyright: 'BailaFit Dance. Todos os direitos reservados.',
};

/** FAQ editável (ex.: landing ou página de ajuda futura) */
export const faqItems = [
  {
    q: 'O que é o modo demonstração?',
    a: 'É uma cópia local do front-end para desenvolvimento: sem Base44, sem cobrança real e com dados salvos no seu navegador (localStorage) quando aplicável.',
  },
  {
    q: 'Os vídeos são reais?',
    a: 'O catálogo de demonstração usa amostras públicas. Substitua URLs de episódios no painel admin (dados mock) ou nos arquivos de seed.',
  },
  {
    q: 'Por que os dados do painel devem usar sempre o mesmo endereço?',
    a: 'No modo local, o catálogo fica no localStorage do navegador (e em dev também em data/catalog-backup.json). Cada URL + porta é um armazenamento separado. O projeto usa http://localhost:4173 para npm run dev e npm run preview. Use o painel Admin → Backup do catálogo para exportar/importar JSON e recuperar dados.',
  },
];

/** Depoimentos para carrossel futuro ou seção marketing */
export const testimonials = [
  {
    name: 'Maria S.',
    text: 'Interface linda e fácil de usar — perfeito para rever desenhos clássicos com a família.',
    rating: 5,
  },
  {
    name: 'Pedro O.',
    text: 'Organização por categorias ficou show. Modo infantil é um diferencial.',
    rating: 5,
  },
];
