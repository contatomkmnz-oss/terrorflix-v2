/** Tipo de catálogo (mesma entidade `Series`, vídeos em `Episode` como nas séries) */
export const CONTENT_TYPE_SERIES = 'series';
export const CONTENT_TYPE_MOVIE = 'movie';

export function isMovie(s) {
  return s?.content_type === 'movie';
}

/** Série de TV (padrão quando ausente — compatível com dados antigos) */
export function isSeriesContent(s) {
  return !s?.content_type || s.content_type === CONTENT_TYPE_SERIES;
}

/**
 * URL de streaming do filme: `movie_url` na série, ou — se vazio — `video_url` do 1.º episódio (ex.: só URL em Admin → Episódios).
 */
export function getMovieStreamUrl(s, episodes = []) {
  if (!isMovie(s)) return '';
  const direct = typeof s?.movie_url === 'string' ? s.movie_url.trim() : '';
  if (direct) return direct;
  const list = Array.isArray(episodes)
    ? episodes.filter((e) => e.series_id === s.id)
    : [];
  const sorted = [...list].sort((a, b) => {
    if ((a.season || 1) !== (b.season || 1)) return (a.season || 1) - (b.season || 1);
    return (a.number || 0) - (b.number || 0);
  });
  const ep = sorted.find((e) => String(e.video_url || '').trim());
  return ep ? String(ep.video_url).trim() : '';
}

/**
 * Há URL de vídeo reproduzível: em filmes `movie_url` ou episódio com `video_url`; em séries pelo menos um episódio com `video_url`.
 * `allEpisodes` pode ser a lista completa (filtra por `series_id`).
 */
export function hasPlayableVideoLink(series, allEpisodes = []) {
  if (!series?.id) return false;
  if (isMovie(series)) return !!getMovieStreamUrl(series, allEpisodes);
  const eps = allEpisodes.filter((e) => e.series_id === series.id);
  return eps.some((e) => String(e.video_url || '').trim() !== '');
}
