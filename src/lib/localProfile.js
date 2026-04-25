const KEY = 'desenhos_active_profile';

/**
 * Lê o perfil ativo do localStorage de forma segura (evita crash com JSON inválido).
 * Em caso de dados corrompidos, remove a chave.
 */
export function readDesenhosActiveProfile() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null || raw === '') return null;
    return JSON.parse(raw);
  } catch {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}
