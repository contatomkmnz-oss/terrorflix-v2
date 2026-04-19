/**
 * Cache em memória das tabelas mock já lidas do localStorage.
 * Evita JSON.parse + alocação em cada `filter`/`list` (a home faz vários pedidos).
 * Invalida-se em `saveTableAsync` e ao importar backup (`applyCatalogSnapshot`).
 */
const cache = new Map();

export function mockTableCacheGet(name) {
  if (cache.has(name)) return cache.get(name);
  return undefined;
}

export function mockTableCacheSet(name, rows) {
  cache.set(name, rows);
}

export function mockTableCacheDelete(name) {
  cache.delete(name);
}

export function mockTableCacheClearAll() {
  cache.clear();
}
