/** Rota para compra / assinatura quando o título está bloqueado. */
export const CATALOG_PREMIUM_UNLOCK_HREF = '/Subscription';

export function isPremiumCatalogLocked(series) {
  if (!series) return false;
  const p = series.premium_unlock_price;
  return typeof p === 'string' && p.trim() !== '';
}

export function formatPremiumUnlockCta(series) {
  const p = series?.premium_unlock_price;
  if (typeof p !== 'string' || !p.trim()) return 'Liberar conteúdo';
  const price = p.trim();
  return price.toLowerCase().startsWith('r$') ? `Liberar por ${price}` : `Liberar por ${price}`;
}
