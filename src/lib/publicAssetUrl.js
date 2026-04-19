/**
 * Prefixa caminhos relativos ao site com `import.meta.env.BASE_URL` (Vite),
 * para capas em `/imagens/...` funcionarem com `base` diferente de `/`.
 */
export function publicAssetUrl(url) {
  if (url == null || typeof url !== 'string') return url;
  const t = url.trim();
  if (!t) return url;
  if (/^(https?:|data:|blob:|idb:)/i.test(t)) return url;

  const baseRaw = import.meta.env.BASE_URL || '/';
  const baseNorm = baseRaw === '/' ? '' : baseRaw.replace(/\/$/, '');
  const path = t.startsWith('/') ? t : `/${t}`;
  if (!baseNorm) return path;
  return `${baseNorm}${path}`;
}
