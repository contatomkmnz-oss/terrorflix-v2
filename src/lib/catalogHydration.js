import {
  applyCatalogSnapshot,
  validateCatalogSnapshot,
} from '@/lib/catalogPersistence';
import { LS_LAST_CATALOG_SAVE, mockTableKey } from '@/config/storageKeys';
import { isFirebaseAuthMode } from '@/lib/firebaseApp';
import { getCachedFirebaseAppUser, waitFirebaseAuthReady } from '@/lib/firebaseAuth';
import { loadSharedCatalogSnapshotFromCloud } from '@/lib/firebaseCatalogSync';

function lsGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseSavedAt(iso) {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * A chave Series ainda nunca foi escrita pelo mock (primeira instalação / storage limpo).
 * Distingue de `[]`, que significa catálogo inicializado mas vazio.
 */
function isSeriesStorageUninitialized() {
  return lsGet(mockTableKey('Series')) === null;
}

/**
 * Antes de carregar o app: tenta ler `data/catalog-backup.json` via servidor Vite (dev e preview).
 *
 * Regras (evita sobrescrever trabalho recente no browser e recupera bem o disco):
 * - Se o backup em ficheiro tiver `savedAt` mais recente que `desenhosflix_last_catalog_save` → aplica o ficheiro.
 * - Senão, se a tabela Series ainda não existir no localStorage → aplica o ficheiro (hidratação inicial).
 * - Caso contrário mantém o localStorage.
 *
 * Sem servidor local (404) mantém-se só o localStorage + painel Importar.
 */
export async function hydrateCatalogBootstrap() {
  if (typeof window === 'undefined') return;

  if (isFirebaseAuthMode()) {
    try {
      await waitFirebaseAuthReady();
      if (getCachedFirebaseAppUser()) {
        const remoteSnapshot = await loadSharedCatalogSnapshotFromCloud();
        if (remoteSnapshot) {
          const v = validateCatalogSnapshot(remoteSnapshot);
          if (v.ok) {
            const remoteTime = parseSavedAt(remoteSnapshot.savedAt);
            const lsTime = parseSavedAt(lsGet(LS_LAST_CATALOG_SAVE));
            if (remoteTime > lsTime || isSeriesStorageUninitialized()) {
              applyCatalogSnapshot(remoteSnapshot);
              return;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[BailaFit] Hidratação a partir do Firebase ignorada', e);
    }
  }

  try {
    const res = await fetch('/__dev/catalog/backup', { method: 'GET' });
    if (res.status === 204 || res.status === 404) return;
    if (!res.ok) return;

    const text = await res.text();
    if (!text || !text.trim()) return;

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn('[BailaFit] Ficheiro catalog-backup.json inválido', e);
      return;
    }

    const v = validateCatalogSnapshot(data);
    if (!v.ok) {
      console.warn('[BailaFit] Backup em disco ignorado:', v.error);
      return;
    }

    const fileTime = parseSavedAt(data.savedAt);
    const lsTime = parseSavedAt(lsGet(LS_LAST_CATALOG_SAVE));

    if (fileTime > lsTime) {
      applyCatalogSnapshot(data);
      return;
    }

    if (isSeriesStorageUninitialized()) {
      applyCatalogSnapshot(data);
      return;
    }
  } catch (e) {
    console.warn('[BailaFit] Hidratação a partir de data/catalog-backup.json ignorada', e);
  }
}
