/**
 * ÚNICA fonte do hero (banner principal) na home.
 * Imagens em `public/imagens/banners/` — edita aqui os slides.
 */

export const heroBanners = [
  {
    id: 'hero-1',
    title: 'O Exorcista',
    bannerImage: '/imagens/banners/hero-slide-1.svg',
    bannerObjectPosition: 'center center',
    description:
      'Uma garota de 12 anos começa a apresentar comportamentos perturbadores e inexplicáveis. O que parecia um problema de saúde rapidamente se transforma em algo muito mais sombrio.',
    year: '1974',
    rating: '16',
    category: 'Paranormal, Destaques',
    movieUrl: '/Player?seriesId=movie-o-exorcista-1974',
    detailUrl: '/SeriesDetail?id=movie-o-exorcista-1974',
  },
  {
    id: 'hero-2',
    title: 'Halloween',
    bannerImage: '/imagens/banners/hero-slide-2.svg',
    bannerObjectPosition: 'center center',
    description:
      'Michael Myers escapa do hospital e regressa a Haddonfield na noite de Halloween — Laurie Strode torna-se o alvo de um terror que não pára.',
    year: '1978',
    rating: '16',
    category: 'Slashers, Destaques',
    movieUrl: '/Player?seriesId=movie-halloween-1978',
    detailUrl: '/SeriesDetail?id=movie-halloween-1978',
  },
];

/**
 * Converte um item do config para o formato interno do componente Hero.
 */
export function normalizeHeroSlide(raw) {
  const banner_image = raw.bannerImage ?? raw.banner_image ?? '';
  const movieUrl = (raw.movieUrl ?? raw.movie_url ?? '').trim();
  const detailUrl = (raw.detailUrl ?? raw.detail_url ?? '').trim();
  const play = resolvePlayTarget(movieUrl);

  return {
    id: String(raw.id),
    title: raw.title ?? '',
    banner_image,
    banner_object_position: raw.bannerObjectPosition ?? raw.banner_object_position ?? 'center center',
    description: raw.description ?? '',
    year: raw.year ?? '',
    rating: raw.rating ?? '',
    category: raw.category ?? '',
    playExternal: play.external,
    playHref: play.href,
    detailHref: detailUrl || null,
  };
}

export function resolvePlayTarget(movieUrl) {
  const s = (movieUrl ?? '').trim();
  if (!s) {
    return { external: false, href: null };
  }
  if (/^https?:\/\//i.test(s)) {
    return { external: true, href: s };
  }
  return { external: false, href: s };
}

/**
 * Slide do hero a partir de um registo `FeaturedBanner` (admin / API), sem título do catálogo.
 */
export function featuredBannerToHeroSlide(b) {
  const play = resolvePlayTarget(b.custom_url);
  const detailUrl = (b.detail_url ?? '').trim();
  const img = (b.image ?? '').trim();
  return {
    id: String(b.id),
    title: b.title ?? '',
    banner_image: img,
    banner_object_position: b.banner_object_position || 'center center',
    description: b.description ?? '',
    year: b.hero_year ?? b.year ?? '',
    rating: b.hero_rating ?? b.rating ?? '',
    category: b.hero_category ?? b.category ?? '',
    playExternal: play.external,
    playHref: play.href,
    detailHref: detailUrl || null,
  };
}
