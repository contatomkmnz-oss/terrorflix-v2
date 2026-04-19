/**
 * Obtém capas reais (poster) na API TMDB para filmes e séries do catálogo.
 *
 * 1. Cria chave grátis: https://www.themoviedb.org/settings/api
 * 2. No .env: TMDB_API_KEY=sua_chave
 * 3. npm run posters:fetch
 *
 * Gera `src/data/catalogPosterUrls.js` com URLs https://image.tmdb.org/t/p/w500/...
 * IDs conhecidos: `src/data/tmdbMovieIds.js` (GET direto; mais fiável que pesquisa).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVIE_CATALOG } from '../src/data/movieCatalog.js';
import { TMDB_LOOKUP_BY_CATALOG_ID } from '../src/data/tmdbMovieIds.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function loadTmdbKey() {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*TMDB_API_KEY\s*=\s*(.+)\s*$/);
      if (m) {
        let v = m[1].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return v;
      }
    }
  }
  return process.env.TMDB_API_KEY || '';
}

function posterUrlFromPath(p) {
  if (!p) return null;
  return `https://image.tmdb.org/t/p/w500${p}`;
}

async function fetchMovieOrTvPoster(key, apiPath) {
  const url = `https://api.themoviedb.org/3${apiPath}?api_key=${key}&language=pt-BR`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  return posterUrlFromPath(j.poster_path);
}

async function searchMoviePoster(key, title, year) {
  const q = encodeURIComponent(title);
  let url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${q}&language=pt-BR`;
  if (year) url += `&year=${year}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  return posterUrlFromPath(j.results?.[0]?.poster_path);
}

async function searchTvPoster(key, title, year) {
  const q = encodeURIComponent(title);
  let url = `https://api.themoviedb.org/3/search/tv?api_key=${key}&query=${q}&language=pt-BR`;
  if (year) url += `&first_air_date_year=${year}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  return posterUrlFromPath(j.results?.[0]?.poster_path);
}

async function posterForEntry(key, e) {
  const lookup = TMDB_LOOKUP_BY_CATALOG_ID[e.id];
  if (lookup) {
    const apiPath =
      lookup.media === 'tv' ? `/tv/${lookup.tmdbId}` : `/movie/${lookup.tmdbId}`;
    let url = await fetchMovieOrTvPoster(key, apiPath);
    if (url) return url;
  }

  if (e.kind === 'series') {
    let url = await searchTvPoster(key, e.title, e.year);
    if (!url && e.title.includes('–')) {
      url = await searchTvPoster(key, e.title.replace(/–/g, '-'), e.year);
    }
    return url;
  }

  let url = await searchMoviePoster(key, e.title, e.year);
  if (!url && e.title.includes('–')) {
    url = await searchMoviePoster(key, e.title.replace(/–/g, '-'), e.year);
  }
  if (!url && e.title.includes('Chuck')) {
    url = await searchMoviePoster(key, "Child's Play", 1988);
  }
  return url;
}

async function main() {
  const key = loadTmdbKey();
  if (!key) {
    console.error(
      'TMDB_API_KEY em falta. Adiciona ao .env (ex.: TMDB_API_KEY=...) — chave grátis em https://www.themoviedb.org/settings/api'
    );
    process.exit(1);
  }

  const entries = MOVIE_CATALOG.filter((e) => e.kind === 'movie' || e.kind === 'series');
  const posterMap = {};
  let ok = 0;
  let fail = 0;

  for (const e of entries) {
    const url = await posterForEntry(key, e);
    if (url) {
      posterMap[e.id] = url;
      ok++;
    } else {
      console.warn('Sem resultado TMDB:', e.id, e.title, e.year);
      fail++;
    }
    await new Promise((r) => setTimeout(r, 280));
  }

  const outPath = path.join(ROOT, 'src', 'data', 'catalogPosterUrls.js');
  const fileBody = `/**
 * Capas de filmes (CDN TMDB). Gerado por \`npm run posters:fetch\` (requer TMDB_API_KEY no .env).
 * Podes editar à mão ou voltar a correr o script.
 */
/** @type {Record<string, string>} */
export const POSTER_URL_BY_CATALOG_ID = ${JSON.stringify(posterMap, null, 2)};

export function posterUrlForCatalogId(id) {
  if (!id || typeof id !== 'string') return null;
  return POSTER_URL_BY_CATALOG_ID[id] || null;
}
`;
  fs.writeFileSync(outPath, fileBody, 'utf8');
  console.log(`Capas TMDB: ${ok} ok, ${fail} sem poster → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
