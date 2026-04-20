import { getDownloadURL, getStorage, ref, uploadBytes, uploadString } from 'firebase/storage';
import { getFirebaseApp, isFirebaseAuthMode } from '@/lib/firebaseApp';

let storageSingleton;

function slugifyName(name) {
  return String(name || 'arquivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function inferExtFromMime(mime) {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  return '';
}

export function isFirebaseStorageEnabled() {
  return isFirebaseAuthMode() && !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
}

export function getFirebaseStorageInstance() {
  if (!isFirebaseStorageEnabled()) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  if (!storageSingleton) storageSingleton = getStorage(app);
  return storageSingleton;
}

export async function uploadCatalogImageFile(file, folder = 'catalog-uploads') {
  const storage = getFirebaseStorageInstance();
  if (!storage) throw new Error('Firebase Storage não configurado.');

  const safeName = slugifyName(file?.name || `imagem${inferExtFromMime(file?.type)}`);
  const storageRef = ref(
    storage,
    `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`
  );

  await uploadBytes(storageRef, file, {
    contentType: file?.type || 'application/octet-stream',
    cacheControl: 'public,max-age=31536000,immutable',
  });
  return getDownloadURL(storageRef);
}

export async function uploadCatalogDataUrl(dataUrl, objectPath) {
  const storage = getFirebaseStorageInstance();
  if (!storage) throw new Error('Firebase Storage não configurado.');

  const storageRef = ref(storage, objectPath);
  await uploadString(storageRef, dataUrl, 'data_url');
  return getDownloadURL(storageRef);
}
