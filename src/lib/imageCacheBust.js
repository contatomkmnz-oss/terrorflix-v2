import { publicAssetUrl } from '@/lib/publicAssetUrl';

/**
 * Anexa um parâmetro de versão à URL para evitar cache HTTP do browser quando
 * a capa/banner é alterada no admin mas o caminho do ficheiro continua igual
 * (ex.: /imagens/banners/poster.svg). Data URLs e blob: não são alteradas.
 */
export function imageUrlWithCacheBust(url, entity) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('idb://')) return url;
  const resolved = publicAssetUrl(url);
  const v = entity?.updated_date || entity?.created_date;
  if (!v) return resolved;
  const sep = resolved.includes('?') ? '&' : '?';
  return `${resolved}${sep}_imgv=${encodeURIComponent(v)}`;
}
