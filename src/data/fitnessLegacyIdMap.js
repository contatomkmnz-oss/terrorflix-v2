/**
 * Renomeação de IDs do catálogo demo fitness (slugs antigos → estrutura atual).
 * Mantém o sufixo (-a, -b, …) para alinhar episódios à série certa.
 */
/** Slot actual no catálogo demo para o antigo «bumbum/pernas» (fileira Treinos principais, sufixo `f`). */
export const FITNESS_PERNAS_CANONICAL_SERIES_ID = 'fit-treinos_principais-f';

export const FITNESS_LEGACY_SERIES_PREFIX_PAIRS = [
  ['fit-para_emagrecer-', 'fit-treinos_principais-'],
  ['fit-treinos_rapidos_15min-', 'fit-treinos_rapidos-'],
  ['fit-bem_estar_hormonal-', 'fit-bem_estar_feminino-'],
];

export function mapLegacyFitnessSeriesId(seriesId) {
  if (!seriesId || typeof seriesId !== 'string') return seriesId;
  if (
    seriesId.startsWith('fit-bumbum_pernas-') ||
    seriesId.startsWith('fit-gluteos_pernas-')
  ) {
    return FITNESS_PERNAS_CANONICAL_SERIES_ID;
  }
  for (const [oldP, newP] of FITNESS_LEGACY_SERIES_PREFIX_PAIRS) {
    if (seriesId.startsWith(oldP)) return newP + seriesId.slice(oldP.length);
  }
  return seriesId;
}
