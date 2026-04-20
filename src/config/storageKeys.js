/**
 * Chaves centralizadas do armazenamento local (localStorage).
 * Usar sempre estes identificadores para evitar divergências entre módulos.
 */

/** Prefixo das tabelas mock (Series, Episode, …) */
export const LS_MOCK_PREFIX = 'desenhosflix_mock_';

export const LS_SUBSCRIPTION_DEMO = 'desenhosflix_demo_subscription';

/** IDs do seed removidos pelo admin (não reinserir nas migrações) */
export const LS_SERIES_SEED_TOMBSTONES = 'desenhosflix_series_seed_tombstones';

/** Perfil ativo na UI (JSON) */
export const LS_ACTIVE_PROFILE = 'desenhos_active_profile';

/** Sessão mock do painel admin (sessionStorage — só modo local, sem API real) */
export const SS_MOCK_ADMIN_SESSION = 'terrorflix_mock_admin_session';

/** Metadado: último autosave do catálogo (ISO string) */
export const LS_LAST_CATALOG_SAVE = 'desenhosflix_last_catalog_save';

/** Presets de nomes de categoria (filmes/séries) criados no admin — JSON string[] */
export const LS_ADMIN_CATEGORY_PRESETS = 'desenhosflix_admin_category_presets';

/** Ordem dos slugs das fileiras na home — JSON string[] (padrão + `cat-*` personalizados) */
export const LS_HOME_NETFLIX_ROW_SLUG_ORDER = 'desenhosflix_home_netflix_row_slug_order';

/** Fileiras extra na home — JSON `{ slug, label }[]` (categorias criadas no admin) */
export const LS_HOME_CUSTOM_CATEGORY_ROWS = 'desenhosflix_home_custom_category_rows';

/** Nomes das tabelas persistidas pelo mock (localMockClient) */
export const MOCK_TABLE_NAMES = [
  'Series',
  'Episode',
  'FeaturedBanner',
  'MyList',
  'WatchHistory',
  'Profile',
  'Avatar',
  'SearchTerm',
  'AccessCode',
  'ContentProposal',
  'User',
  'Subscription',
  'Notification',
];

export function mockTableKey(tableName) {
  return LS_MOCK_PREFIX + tableName;
}

/** Todas as chaves incluídas em backup/export/import e hidratação em disco (dev). */
export function getAllCatalogStorageKeys() {
  return [
    ...MOCK_TABLE_NAMES.map(mockTableKey),
    LS_SERIES_SEED_TOMBSTONES,
    LS_ACTIVE_PROFILE,
    LS_SUBSCRIPTION_DEMO,
    LS_ADMIN_CATEGORY_PRESETS,
    LS_HOME_NETFLIX_ROW_SLUG_ORDER,
    LS_HOME_CUSTOM_CATEGORY_ROWS,
  ];
}

/**
 * Chaves partilhadas do catálogo/conteúdo que devem sobreviver entre browsers
 * e deploys. Não inclui estado pessoal do utilizador (lista, histórico, perfil ativo, etc.).
 */
export function getSharedCatalogStorageKeys() {
  return [
    mockTableKey('Series'),
    mockTableKey('Episode'),
    mockTableKey('FeaturedBanner'),
    mockTableKey('Avatar'),
    mockTableKey('AccessCode'),
    mockTableKey('ContentProposal'),
    mockTableKey('Notification'),
    LS_SERIES_SEED_TOMBSTONES,
    LS_ADMIN_CATEGORY_PRESETS,
    LS_HOME_NETFLIX_ROW_SLUG_ORDER,
    LS_HOME_CUSTOM_CATEGORY_ROWS,
  ];
}
