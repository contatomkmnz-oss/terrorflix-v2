import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb, getCachedFirebaseAppUser } from '@/lib/firebaseAuth';
import { isFirebaseAuthMode } from '@/lib/firebaseApp';
import { getSharedCatalogStorageKeys } from '@/config/storageKeys';
import { idbGetDataUrl } from '@/lib/localImageIdb';
import { uploadCatalogDataUrl, isFirebaseStorageEnabled } from '@/lib/firebaseStorage';

const CATALOG_META_PATH = ['appState', 'publicCatalog'];
const SHARED_KEYS = getSharedCatalogStorageKeys();
const SERIES_IMAGE_FIELDS = ['cover_url', 'banner_url'];
const uploadedCloudUrlCache = new Map();

let lastSharedFingerprint = '';

function getDbOrNull() {
  if (!isFirebaseAuthMode()) return null;
  return getFirebaseDb();
}

function getMetaRef(db) {
  return doc(db, ...CATALOG_META_PATH);
}

function getKeysCollection(db) {
  return collection(db, ...CATALOG_META_PATH, 'keys');
}

function getKeyDocRef(db, key) {
  return doc(db, ...CATALOG_META_PATH, 'keys', key);
}

function parseIsoLike(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  return '';
}

function buildSharedSnapshot(fullSnapshot) {
  const keys = {};
  for (const key of SHARED_KEYS) {
    if (typeof fullSnapshot?.keys?.[key] === 'string') {
      keys[key] = fullSnapshot.keys[key];
    }
  }
  return {
    schemaVersion: fullSnapshot?.schemaVersion ?? 2,
    savedAt: fullSnapshot?.savedAt || new Date().toISOString(),
    keys,
  };
}

async function migrateSeriesImagesToCloud(rows) {
  if (!Array.isArray(rows) || !isFirebaseStorageEnabled()) return rows;

  const migrated = [];
  for (const row of rows) {
    const next = { ...row };
    for (const field of SERIES_IMAGE_FIELDS) {
      const value = next[field];
      if (typeof value !== 'string') continue;
      if (!value.startsWith('idb://') && !value.startsWith('data:')) continue;

      let dataUrl = value;
      if (value.startsWith('idb://')) {
        try {
          dataUrl = await idbGetDataUrl(value);
        } catch {
          dataUrl = null;
        }
      }
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) continue;

      const cacheKey = `${value}|${dataUrl.slice(0, 64)}|${dataUrl.length}`;
      let remoteUrl = uploadedCloudUrlCache.get(cacheKey);
      if (!remoteUrl) {
        remoteUrl = await uploadCatalogDataUrl(
          dataUrl,
          `catalog/series/${row.id}/${field}-${Date.now()}-${crypto.randomUUID()}`
        );
        uploadedCloudUrlCache.set(cacheKey, remoteUrl);
      }
      next[field] = remoteUrl;
    }
    migrated.push(next);
  }
  return migrated;
}

async function migrateEpisodeImagesToCloud(rows) {
  if (!Array.isArray(rows) || !isFirebaseStorageEnabled()) return rows;

  const migrated = [];
  for (const row of rows) {
    const next = { ...row };
    const value = next.thumbnail_url;
    if (typeof value !== 'string' || (!value.startsWith('idb://') && !value.startsWith('data:'))) {
      migrated.push(next);
      continue;
    }

    let dataUrl = value;
    if (value.startsWith('idb://')) {
      try {
        dataUrl = await idbGetDataUrl(value);
      } catch {
        dataUrl = null;
      }
    }
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      migrated.push(next);
      continue;
    }

    const cacheKey = `${value}|${dataUrl.slice(0, 64)}|${dataUrl.length}`;
    let remoteUrl = uploadedCloudUrlCache.get(cacheKey);
    if (!remoteUrl) {
      remoteUrl = await uploadCatalogDataUrl(
        dataUrl,
        `catalog/episodes/${row.id}/thumbnail-${Date.now()}-${crypto.randomUUID()}`
      );
      uploadedCloudUrlCache.set(cacheKey, remoteUrl);
    }
    next.thumbnail_url = remoteUrl;
    migrated.push(next);
  }
  return migrated;
}

async function promoteEmbeddedImages(sharedSnapshot) {
  const next = {
    ...sharedSnapshot,
    keys: { ...sharedSnapshot.keys },
  };

  const seriesKey = SHARED_KEYS.find((key) => key.endsWith('Series'));
  const episodeKey = SHARED_KEYS.find((key) => key.endsWith('Episode'));

  if (seriesKey && typeof next.keys[seriesKey] === 'string') {
    try {
      const parsed = JSON.parse(next.keys[seriesKey]);
      next.keys[seriesKey] = JSON.stringify(await migrateSeriesImagesToCloud(parsed));
    } catch {
      /* mantém valor original */
    }
  }

  if (episodeKey && typeof next.keys[episodeKey] === 'string') {
    try {
      const parsed = JSON.parse(next.keys[episodeKey]);
      next.keys[episodeKey] = JSON.stringify(await migrateEpisodeImagesToCloud(parsed));
    } catch {
      /* mantém valor original */
    }
  }

  return next;
}

function rememberFingerprint(snapshot) {
  lastSharedFingerprint = JSON.stringify(snapshot.keys);
}

export function canWriteSharedCatalogToFirebase() {
  const user = getCachedFirebaseAppUser();
  return !!user && user.role === 'admin';
}

export async function loadSharedCatalogSnapshotFromCloud() {
  const db = getDbOrNull();
  if (!db) return null;

  const [metaSnap, keysSnap] = await Promise.all([getDoc(getMetaRef(db)), getDocs(getKeysCollection(db))]);
  if (!metaSnap.exists() && keysSnap.empty) return null;

  const meta = metaSnap.exists() ? metaSnap.data() : {};
  const keys = {};
  keysSnap.forEach((item) => {
    const value = item.data()?.value;
    if (typeof value === 'string') keys[item.id] = value;
  });

  const snapshot = {
    schemaVersion: Number(meta?.schemaVersion || 2),
    savedAt: parseIsoLike(meta?.savedAt) || parseIsoLike(meta?.updatedAt) || '',
    keys,
  };

  rememberFingerprint(snapshot);
  return snapshot;
}

export async function syncSharedCatalogSnapshotToCloud(fullSnapshot) {
  const db = getDbOrNull();
  if (!db || !canWriteSharedCatalogToFirebase()) return false;

  const sharedSnapshot = await promoteEmbeddedImages(buildSharedSnapshot(fullSnapshot));
  const fingerprint = JSON.stringify(sharedSnapshot.keys);
  if (fingerprint === lastSharedFingerprint) return false;

  const batch = writeBatch(db);
  for (const key of SHARED_KEYS) {
    const keyRef = getKeyDocRef(db, key);
    const value = sharedSnapshot.keys[key];
    if (typeof value === 'string') {
      batch.set(
        keyRef,
        {
          value,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      batch.delete(keyRef);
    }
  }

  batch.set(
    getMetaRef(db),
    {
      schemaVersion: sharedSnapshot.schemaVersion,
      savedAt: sharedSnapshot.savedAt,
      updatedAt: serverTimestamp(),
      updatedBy: {
        uid: getCachedFirebaseAppUser()?.id || null,
        email: getCachedFirebaseAppUser()?.email || null,
      },
    },
    { merge: true }
  );

  await batch.commit();
  rememberFingerprint(sharedSnapshot);
  return true;
}

export async function clearSharedCatalogSnapshotFingerprint() {
  lastSharedFingerprint = '';
}

export async function deleteSharedCatalogKeyFromCloud(key) {
  const db = getDbOrNull();
  if (!db || !canWriteSharedCatalogToFirebase()) return;
  await deleteDoc(getKeyDocRef(db, key));
  lastSharedFingerprint = '';
}
