/**
 * Home: blocos de conteúdo (treinos / dança / …). Slugs = parâmetro /Browse?section=
 *
 * Ordem na UI e categorias extra vêm de `@/lib/homeRowOrderPreference` (localStorage).
 * `isHomeCatalogSlug` / `seriesQualifiesForHomeCatalogEpisodes`: `@/lib/homeRowOrderPreference`.
 */
export const NETFLIX_HOME_ROW_ORDER = [
  { slug: 'comecar_rapido', label: 'Começar rápido' },
  { slug: 'treinos_principais', label: 'Treinos principais' },
  { slug: 'danca', label: 'Dança' },
  { slug: 'programas_desafios', label: 'Programas e desafios' },
  { slug: 'extras', label: 'Área Vip' },
];

/** Marcador na sequência da home para «Continue de onde parou». */
export const CONTINUE_WATCHING_HOME_KEY = '__continue_watching__';

/** Ordem estática de referência (sem categorias personalizadas). Preferir `getEffectiveHomePageRowSequence()`. */
export const HOME_PAGE_ROW_SEQUENCE = [
  CONTINUE_WATCHING_HOME_KEY,
  'comecar_rapido',
  'treinos_principais',
  'danca',
  'programas_desafios',
  'extras',
];

/** Mapas só com as cinco fileiras padrão (build / fallback). */
export const SLUG_TO_LABEL = Object.fromEntries(
  NETFLIX_HOME_ROW_ORDER.map(({ slug, label }) => [slug, label])
);

export const LABEL_TO_SLUG = Object.fromEntries(
  NETFLIX_HOME_ROW_ORDER.map(({ slug, label }) => [label, slug])
);
