/**
 * IDs TMDB por `id` do catálogo — usado por `scripts/fetch-tmdb-posters.mjs`
 * para GET direto (evita falsos positivos na pesquisa).
 * `media: 'tv'` para séries/prelúdios.
 * O lote `movieCatalogHorror70.js` não está mapeado aqui; o script usa pesquisa.
 */
/** @type {Record<string, { media: 'movie' | 'tv'; tmdbId: number }>} */
export const TMDB_LOOKUP_BY_CATALOG_ID = {
  'movie-a-voz-assassina-1989': { media: 'movie', tmdbId: 30652 }, // Out of the Dark (1988) — título PT
  'movie-it-bem-vindos-a-derry-2025': { media: 'tv', tmdbId: 200875 },
  'movie-o-exorcista-1974': { media: 'movie', tmdbId: 9552 },
  'movie-halloween-1978': { media: 'movie', tmdbId: 948 },
  'movie-psicose-1960': { media: 'movie', tmdbId: 539 },
  'movie-o-iluminado-1980': { media: 'movie', tmdbId: 694 },
  'movie-o-massacre-da-serra-eletrica-1974': { media: 'movie', tmdbId: 30497 },
  'movie-sexta-feira-13-1980': { media: 'movie', tmdbId: 4488 },
  'movie-a-hora-do-pesadelo-1984': { media: 'movie', tmdbId: 1637 },
  'movie-chuck-brinquedo-assassino-1989': { media: 'movie', tmdbId: 10585 },
  'movie-panico-1996': { media: 'movie', tmdbId: 4232 },
  'movie-hellraiser-2018': { media: 'movie', tmdbId: 9003 },
  'movie-poltergeist-1982': { media: 'movie', tmdbId: 609 },
  'movie-a-profecia-1977': { media: 'movie', tmdbId: 796 },
  'movie-o-chamado-2003': { media: 'movie', tmdbId: 3138 },
  'movie-a-casa-de-cera-2005': { media: 'movie', tmdbId: 12501 },
  'movie-jogos-mortais-2004': { media: 'movie', tmdbId: 298 },
  'movie-atividade-paranormal-2007': { media: 'movie', tmdbId: 13827 },
  'movie-invocacao-do-mal-2013': { media: 'movie', tmdbId: 138843 },
  'movie-rec-2008': { media: 'movie', tmdbId: 8329 },
  'movie-o-grito-2004': { media: 'movie', tmdbId: 6674 },
  'series-it-a-coisa-1990': { media: 'tv', tmdbId: 19614 },
  'movie-a-bruxa-de-blair-1999': { media: 'movie', tmdbId: 2667 },
  'movie-premonicao-1999': { media: 'movie', tmdbId: 9530 },
  'movie-exterminio-2003': { media: 'movie', tmdbId: 28 },
  'movie-a-entidade-2012': { media: 'movie', tmdbId: 82507 },
  'movie-alien-1979': { media: 'movie', tmdbId: 348 },
  'movie-o-enigma-de-outro-mundo-1982': { media: 'movie', tmdbId: 10973 },
  'movie-corra-2017': { media: 'movie', tmdbId: 419430 },
  'movie-hereditario-2018': { media: 'movie', tmdbId: 493922 },
  'movie-a-morte-do-demonio-1981': { media: 'movie', tmdbId: 764 },
  'movie-out-of-the-dark-2014': { media: 'movie', tmdbId: 283686 },
  'movie-panico-na-floresta-2004': { media: 'movie', tmdbId: 11362 },
  'movie-todo-mundo-em-panico-2000': { media: 'movie', tmdbId: 4248 },
};
