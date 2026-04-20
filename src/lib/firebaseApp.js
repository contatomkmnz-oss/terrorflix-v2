/**
 * Configuração do Firebase (Auth + Firestore) a partir de variáveis VITE_*.
 * Só inicializa quando VITE_USE_FIREBASE_AUTH=true e os campos obrigatórios existem.
 */
import { initializeApp, getApps } from 'firebase/app';

export function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured() {
  const c = getFirebaseConfig();
  return !!(c.apiKey && c.projectId && c.appId);
}

/** Modo Firebase activo: env + config mínima. */
export function isFirebaseAuthMode() {
  return import.meta.env.VITE_USE_FIREBASE_AUTH === 'true' && isFirebaseConfigured();
}

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(getFirebaseConfig());
}
