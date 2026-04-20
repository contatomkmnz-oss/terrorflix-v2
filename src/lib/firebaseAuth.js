/**
 * Auth Google + documento de utilizador em Firestore (coleção `users`).
 */
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseApp, isFirebaseAuthMode } from '@/lib/firebaseApp';

let authSingleton;
let dbSingleton;
let listenerStarted = false;
let firstAuthResolved = false;
let firstAuthPromiseResolve;
const firstAuthPromise = new Promise((r) => {
  firstAuthPromiseResolve = r;
});

let cachedAppUser = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn({ user: cachedAppUser, ready: firstAuthResolved }));
}

export function getFirebaseAuthInstance() {
  if (!isFirebaseAuthMode()) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  if (!authSingleton) authSingleton = getAuth(app);
  return authSingleton;
}

export function getFirebaseDb() {
  if (!isFirebaseAuthMode()) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  if (!dbSingleton) dbSingleton = getFirestore(app);
  return dbSingleton;
}

async function mapFirebaseUser(fu) {
  const db = getFirebaseDb();
  let role = 'user';
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', fu.uid));
      if (snap.exists() && snap.data()?.role === 'admin') role = 'admin';
    } catch {
      /* offline ou regras — mantém user */
    }
  }
  return {
    id: fu.uid,
    email: fu.email || '',
    full_name: fu.displayName || '',
    avatar_url: fu.photoURL || undefined,
    role,
    activated: true,
  };
}

async function syncUserDoc(fu) {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(
    doc(db, 'users', fu.uid),
    {
      email: fu.email || null,
      displayName: fu.displayName || null,
      photoURL: fu.photoURL || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function ensureAuthListener() {
  if (listenerStarted || !isFirebaseAuthMode()) return;
  const auth = getFirebaseAuthInstance();
  if (!auth) return;
  listenerStarted = true;

  onAuthStateChanged(auth, async (fu) => {
    const mapped = fu ? await mapFirebaseUser(fu) : null;
    if (!firstAuthResolved) {
      firstAuthResolved = true;
      firstAuthPromiseResolve();
    }
    cachedAppUser = mapped;
    emit();
  });
}

/** Primeiro evento de auth (logado ou não). */
export function waitFirebaseAuthReady() {
  ensureAuthListener();
  return firstAuthPromise;
}

export function getCachedFirebaseAppUser() {
  return cachedAppUser;
}

/**
 * Subscreve mudanças de sessão Firebase. `ready` fica true após o primeiro onAuthStateChanged.
 * @param {(payload: { user: object | null, ready: boolean }) => void} cb
 */
export function subscribeFirebaseAuth(cb) {
  ensureAuthListener();
  listeners.add(cb);
  cb({ user: cachedAppUser, ready: firstAuthResolved });
  return () => listeners.delete(cb);
}

export async function signInWithGoogle() {
  ensureAuthListener();
  const auth = getFirebaseAuthInstance();
  if (!auth) throw new Error('Firebase Auth não inicializado');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const { user: fu } = await signInWithPopup(auth, provider);
  await syncUserDoc(fu);
  cachedAppUser = await mapFirebaseUser(fu);
  emit();
  return cachedAppUser;
}

export async function signOutFirebase() {
  const auth = getFirebaseAuthInstance();
  if (auth) await signOut(auth);
  cachedAppUser = null;
  emit();
}
