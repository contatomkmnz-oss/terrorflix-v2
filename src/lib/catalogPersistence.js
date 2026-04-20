import {
  getAllCatalogStorageKeys,
  LS_LAST_CATALOG_SAVE,
} from '@/config/storageKeys';
import { mockTableCacheClearAll } from '@/api/mockTableReadCache';
import { syncSharedCatalogSnapshotToCloud } from '@/lib/firebaseCatalogSync';

/** Versão do formato JSON de backup / ficheiro em disco. */
export const CATALOG_BACKUP_SCHEMA_VERSION = 2;

let _debounceTimer;

/** Grava o snapshot actual no disco (dev/preview com servidor Vite). */
async function postCatalogSnapshotToDisk(snapshot = buildCatalogSnapshot()) {
  try {
    const res = await fetch('/__dev/catalog/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    if (!res.ok && res.status !== 404) {
      console.warn('[BailaFit] Autosave para data/catalog-backup.json falhou', res.status);
    }
  } catch (e) {
    /* Sem servidor local (ex.: ficheiros estáticos) — só localStorage. */
  }
}

function safeLsGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLsSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Monta o objeto de backup a partir do localStorage atual.
 */
export function buildCatalogSnapshot() {
  const keys = {};
  for (const key of getAllCatalogStorageKeys()) {
    const v = safeLsGet(key);
    if (v !== null) keys[key] = v;
  }
  return {
    schemaVersion: CATALOG_BACKUP_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    keys,
  };
}

export function validateCatalogSnapshot(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Ficheiro vazio ou inválido.' };
  if (raw.schemaVersion !== CATALOG_BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Versão do backup (${raw.schemaVersion}) não compatível (esperado ${CATALOG_BACKUP_SCHEMA_VERSION}).`,
    };
  }
  if (!raw.keys || typeof raw.keys !== 'object') {
    return { ok: false, error: 'Backup sem campo "keys".' };
  }
  return { ok: true };
}

/**
 * Aplica snapshot no localStorage (substitui chaves presentes no backup).
 */
export function applyCatalogSnapshot(raw) {
  const v = validateCatalogSnapshot(raw);
  if (!v.ok) throw new Error(v.error);

  for (const [k, val] of Object.entries(raw.keys)) {
    if (typeof val === 'string') safeLsSet(k, val);
    else safeLsSet(k, JSON.stringify(val));
  }

  mockTableCacheClearAll();
  touchLastSaved();
}

export function touchLastSaved() {
  safeLsSet(LS_LAST_CATALOG_SAVE, new Date().toISOString());
}

export function getLastSavedDisplay() {
  return safeLsGet(LS_LAST_CATALOG_SAVE);
}

/**
 * Após alterações no mock: marca último save no localStorage e agenda gravação em
 * `data/catalog-backup.json` quando o servidor Vite (dev ou preview) expõe o endpoint.
 */
export function scheduleCatalogSync() {
  touchLastSaved();

  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    const snapshot = buildCatalogSnapshot();
    void Promise.allSettled([
      postCatalogSnapshotToDisk(snapshot),
      syncSharedCatalogSnapshotToCloud(snapshot),
    ]);
  }, 700);
}

/**
 * Cancela o debounce e grava imediatamente (útil ao fechar o separador antes dos 700 ms).
 */
export function flushCatalogSyncNow() {
  clearTimeout(_debounceTimer);
  const snapshot = buildCatalogSnapshot();
  return Promise.allSettled([
    postCatalogSnapshotToDisk(snapshot),
    syncSharedCatalogSnapshotToCloud(snapshot),
  ]);
}

export function downloadCatalogBackupJson() {
  const snap = buildCatalogSnapshot();
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `members-bailafit-catalog-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Limpa todas as chaves do catálogo (pedido explícito do utilizador). Não apaga sozinho.
 */
export function clearAllCatalogKeys() {
  for (const key of getAllCatalogStorageKeys()) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem(LS_LAST_CATALOG_SAVE);
  } catch {
    /* ignore */
  }
}
