/**
 * Converte modelos Prisma para o formato legado `Series` / `Episode` / `FeaturedBanner` do front.
 */

const DEFAULT_POSTER = '/imagens/banners/poster-movie.svg';
const DEFAULT_BANNER = '/imagens/banners/hero-slide-1.svg';
const DEFAULT_HERO_IMAGE = '/imagens/banners/hero-slide-2.svg';

function urlOrDefault(value, fallback) {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s.length > 0 ? s : fallback;
}

function categoryLabelsFromMovie(movie) {
  return movie.categories.map((mc) => mc.category.name);
}

function categoryLabelsFromSeries(series) {
  return series.categories.map((sc) => sc.category.name);
}

export function movieToSeriesRow(movie) {
  const labels = categoryLabelsFromMovie(movie);
  return {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    year: movie.year,
    age_rating: movie.rating || '16',
    featured: movie.isFeatured,
    published: movie.isPublished,
    total_views: movie.totalViews,
    cover_url: urlOrDefault(movie.posterImage, DEFAULT_POSTER),
    banner_url: urlOrDefault(movie.bannerImage, DEFAULT_BANNER),
    banner_object_position: movie.bannerObjectPosition || '50% center',
    highlighted_home_section: movie.highlightedHomeSection || '',
    categories: labels,
    category: labels.join(', '),
    content_type: 'movie',
    movie_url: movie.movieUrl || '',
    trailer_url: movie.trailerUrl || '',
    slug: movie.slug,
    created_date: movie.createdAt?.toISOString?.() ?? movie.createdAt,
    updated_date: movie.updatedAt?.toISOString?.() ?? movie.updatedAt,
  };
}

export function seriesToSeriesRow(series) {
  const labels = categoryLabelsFromSeries(series);
  return {
    id: series.id,
    title: series.title,
    description: series.description,
    year: series.year,
    age_rating: series.rating || '16',
    featured: series.isFeatured,
    published: series.isPublished,
    total_views: series.totalViews,
    cover_url: urlOrDefault(series.posterImage, DEFAULT_POSTER),
    banner_url: urlOrDefault(series.bannerImage, DEFAULT_BANNER),
    banner_object_position: series.bannerObjectPosition || '50% center',
    highlighted_home_section: series.highlightedHomeSection || '',
    categories: labels,
    category: labels.join(', '),
    content_type: 'series',
    movie_url: '',
    slug: series.slug,
    created_date: series.createdAt?.toISOString?.() ?? series.createdAt,
    updated_date: series.updatedAt?.toISOString?.() ?? series.updatedAt,
  };
}

export function episodeToRow(ep) {
  return {
    id: ep.id,
    series_id: ep.seriesId,
    title: ep.title,
    season: ep.seasonNumber,
    number: ep.episodeNumber,
    description: ep.description || '',
    video_url: ep.videoUrl || '',
    duration: ep.duration ?? 0,
    thumbnail_url: ep.thumbnail || '',
    created_date: ep.createdAt?.toISOString?.() ?? ep.createdAt,
    updated_date: ep.updatedAt?.toISOString?.() ?? ep.updatedAt,
  };
}

export function heroToFeaturedBanner(hb) {
  const linkedId = hb.linkedMovieId || hb.linkedSeriesId || '';
  return {
    id: hb.id,
    series_id: linkedId,
    order: hb.sortOrder,
    active: hb.isActive,
    title: hb.title,
    subtitle: hb.subtitle,
    description: hb.description,
    image: urlOrDefault(hb.image, DEFAULT_HERO_IMAGE),
    custom_url: hb.customUrl,
    detail_url: hb.detailUrl || '',
    banner_object_position: hb.bannerObjectPosition || 'center center',
    hero_year: hb.heroYear || '',
    hero_rating: hb.heroRating || '',
    hero_category: hb.heroCategory || '',
  };
}

export function mergeSeriesLists(movies, seriesList) {
  return [...movies.map(movieToSeriesRow), ...seriesList.map(seriesToSeriesRow)];
}
