/**
 * Capas via miniaturas de artigos da Wikipedia — sem API key.
 * Só aceita páginas cujas categorias parecem filme/série (evita Lula, pinturas, etc.).
 *
 * Política User-Agent: https://foundation.wikimedia.org/wiki/Policy:User-Agent_policy
 *
 * Menos fiável que TMDB. Uso: npm run posters:wiki
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVIE_CATALOG } from '../src/data/movieCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const WIKI_USER_AGENT =
  process.env.WIKIPEDIA_USER_AGENT ||
  'ClassicToonVault/1.0 (poster fetch script; https://www.mediawiki.org/wiki/API:Etiquette)';

/** Título exato na Wikipedia quando a pesquisa falha ou devolve artigo errado. */
const WIKI_PAGE_OVERRIDE_BY_CATALOG_ID = {
  'movie-a-voz-assassina-1989': { lang: 'en', title: 'Out of the Dark (1988 film)' },
  'movie-voce-e-o-proximo-2011': { lang: 'en', title: "You're Next" },
};

function wikiApiUrl(lang, params) {
  const q = new URLSearchParams({ ...params, format: 'json' });
  return `https://${lang}.wikipedia.org/w/api.php?${q}`;
}

async function wikiSearch(lang, q) {
  const url = wikiApiUrl(lang, {
    action: 'query',
    list: 'search',
    srsearch: q,
    srlimit: '8',
    srnamespace: '0',
  });
  const r = await fetch(url, { headers: { 'User-Agent': WIKI_USER_AGENT } });
  if (!r.ok) return [];
  const j = await r.json();
  return j.query?.search?.map((s) => s.title) || [];
}

async function wikiGetCategories(lang, pageTitle) {
  const url = wikiApiUrl(lang, {
    action: 'query',
    titles: pageTitle,
    prop: 'categories',
    cllimit: '80',
    clshow: '!hidden',
  });
  const r = await fetch(url, { headers: { 'User-Agent': WIKI_USER_AGENT } });
  if (!r.ok) return [];
  const j = await r.json();
  const page = Object.values(j.query?.pages || {})[0];
  if (!page || page.missing || page.invalid) return [];
  return page.categories || [];
}

/**
 * @param {{ title: string }[]} categories
 * @param {number} year
 * @param {boolean} isSeries
 */
function looksLikeFilmOrSeriesPage(categories, year, isSeries) {
  const blob = categories
    .map((c) => c.title.replace(/^Category:|^Categoria:/i, ''))
    .join(' ')
    .toLowerCase();

  if (/disambiguation|desambiguação|homonym|homónimos/i.test(blob)) return false;

  if (isSeries) {
    return /television|televisão|series|séries|miniseries|minissérie|programas de televisão|television programs/i.test(
      blob
    );
  }

  const y = String(year);
  if (new RegExp(`filmes de ${y}|films of ${y}|${y} films|${y} horror|filmes de terror`, 'i').test(blob))
    return true;
  if (
    /horror films|science fiction films|thriller films|filmes de suspense|american films|british films|filmes dos estados|filmes britânicos|filmes norte-americanos|filmes de drama|comedy films|filmes de ficção/i.test(
      blob
    )
  )
    return true;
  if (/documentary films|short films|animated films|filmes documentários/i.test(blob)) return true;
  return false;
}

/** Se existir "Filmes de YYYY" / "YYYY films", o ano deve coincidir (±1) com o catálogo. */
function yearInCategoriesMatches(categories, year) {
  const blob = categories.map((c) => c.title).join(' | ');
  const explicit = [];
  const re = /(?:Filmes de|films of)\s(\d{4})|(\d{4})\s+films/gi;
  let m;
  while ((m = re.exec(blob)) !== null) {
    explicit.push(Number(m[1] || m[2]));
  }
  if (explicit.length === 0) return true;
  return explicit.some((y) => Math.abs(y - year) <= 1);
}

async function wikiThumbnail(lang, pageTitle) {
  const url = wikiApiUrl(lang, {
    action: 'query',
    titles: pageTitle,
    prop: 'pageimages',
    pithumbsize: '500',
    redirects: '1',
  });
  const r = await fetch(url, { headers: { 'User-Agent': WIKI_USER_AGENT } });
  if (!r.ok) return null;
  const j = await r.json();
  const pages = j.query?.pages;
  if (!pages) return null;
  const p = Object.values(pages)[0];
  if (!p || p.missing || p.invalid) return null;
  const src = p.thumbnail?.source;
  return typeof src === 'string' ? src : null;
}

async function tryLangQueries(lang, queries, year, isSeries) {
  for (const q of queries) {
    const titles = await wikiSearch(lang, q);
    for (const t of titles) {
      const cats = await wikiGetCategories(lang, t);
      if (!looksLikeFilmOrSeriesPage(cats, year, isSeries)) continue;
      if (!isSeries && !yearInCategoriesMatches(cats, year)) continue;
      const thumb = await wikiThumbnail(lang, t);
      if (thumb) return thumb;
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  return null;
}

async function posterForEntry(e) {
  const year = e.year;
  const title = e.title.trim();
  const isSeries = e.kind === 'series';

  const override = WIKI_PAGE_OVERRIDE_BY_CATALOG_ID[e.id];
  if (override) {
    const thumb = await wikiThumbnail(override.lang, override.title);
    if (thumb) return thumb;
  }

  const ptQueries = isSeries
    ? [`${title} (${year})`, `${title}`, `${title} (minissérie)`]
    : [`${title} (${year})`, `${title} (filme)`, `${title} ${year}`];

  const enQueries = isSeries
    ? [`${title} (${year} TV series)`, `${title} (miniseries)`]
    : [`${title} (${year} film)`, `${title} (film)`];

  let url = await tryLangQueries('pt', ptQueries, year, isSeries);
  if (url) return url;
  url = await tryLangQueries('en', enQueries, year, isSeries);
  return url;
}

async function main() {
  const entries = MOVIE_CATALOG.filter((e) => e.kind === 'movie' || e.kind === 'series');
  const posterMap = {};
  let ok = 0;
  let fail = 0;

  for (const e of entries) {
    const url = await posterForEntry(e);
    if (url) {
      posterMap[e.id] = url;
      ok++;
    } else {
      console.warn('Sem miniatura Wikipedia:', e.id, e.title, e.year);
      fail++;
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  const outPath = path.join(ROOT, 'src', 'data', 'catalogPosterUrls.js');
  const fileBody = `/**
 * Capas (miniaturas Wikimedia / artigos Wikipedia). Gerado por \`npm run posters:wiki\` (sem API key).
 * Qualidade habitualmente melhor com TMDB (também grátis): \`npm run posters:fetch\` + TMDB_API_KEY.
 */
/** @type {Record<string, string>} */
export const POSTER_URL_BY_CATALOG_ID = ${JSON.stringify(posterMap, null, 2)};

export function posterUrlForCatalogId(id) {
  if (!id || typeof id !== 'string') return null;
  return POSTER_URL_BY_CATALOG_ID[id] || null;
}
`;
  fs.writeFileSync(outPath, fileBody, 'utf8');
  console.log(`Capas Wikipedia: ${ok} ok, ${fail} sem imagem → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
