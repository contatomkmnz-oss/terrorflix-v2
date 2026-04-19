import {
  idbPutDataUrl,
  idbGetDataUrl,
  idbDeleteByPrefix,
  seriesImageKey,
  episodeImageKey,
} from '@/lib/localImageIdb';
import { publicAssetUrl } from '@/lib/publicAssetUrl';
import { buildMockSeed } from '@/data/mockSeed';

const SERIES_FIELDS = ['cover_url', 'banner_url'];

/** Mapa id → série do seed (capas públicas quando o IDB não tem `idb://`). */
let seedSeriesByIdCache = null;
function getSeedSeriesRow(seriesId) {
  if (!seriesId) return null;
  if (!seedSeriesByIdCache) {
    try {
      seedSeriesByIdCache = Object.fromEntries(buildMockSeed().Series.map((s) => [s.id, s]));
    } catch {
      seedSeriesByIdCache = {};
    }
  }
  return seedSeriesByIdCache[seriesId] || null;
}

function seedPublicImagePath(seriesId, field) {
  const row = getSeedSeriesRow(seriesId);
  const u = row?.[field];
  if (typeof u !== 'string') return null;
  const t = u.trim();
  if (!t || t.startsWith('idb:') || t.startsWith('data:')) return null;
  return t;
}

/** Move data URLs para IndexedDB; substitui por `idb://...`. */
export async function stripSeriesImageFieldsForStorage(row) {
  if (!row?.id) return row;
  const out = { ...row };
  for (const field of SERIES_FIELDS) {
    const v = out[field];
    if (typeof v !== 'string' || !v.startsWith('data:')) continue;
    const key = seriesImageKey(row.id, field);
    await idbPutDataUrl(key, v);
    out[field] = key;
  }
  return out;
}

export async function hydrateSeriesImageFields(row) {
  if (!row) return row;
  const out = { ...row };
  for (const field of SERIES_FIELDS) {
    const v = out[field];
    if (typeof v !== 'string' || !v.startsWith('idb://')) continue;
    try {
      const data = await idbGetDataUrl(v);
      const ok = data && String(data).trim();
      if (ok) {
        out[field] = data;
      } else {
        const seedPath = seedPublicImagePath(row.id, field);
        out[field] = seedPath
          ? publicAssetUrl(seedPath)
          : field === 'cover_url'
            ? publicAssetUrl('/imagens/banners/poster-movie.svg')
            : '';
      }
    } catch (e) {
      console.warn('[catalogImageStorage] hydrateSeriesImageFields', field, e);
      const seedPath = seedPublicImagePath(row.id, field);
      out[field] = seedPath
        ? publicAssetUrl(seedPath)
        : field === 'cover_url'
          ? publicAssetUrl('/imagens/banners/poster-movie.svg')
          : '';
    }
  }
  const cover = out.cover_url;
  if (cover == null || (typeof cover === 'string' && !cover.trim()) || typeof cover !== 'string') {
    const seedPath = seedPublicImagePath(row.id, 'cover_url');
    out.cover_url = seedPath ? publicAssetUrl(seedPath) : publicAssetUrl('/imagens/banners/poster-movie.svg');
  }
  return out;
}

export async function stripEpisodeImageFieldsForStorage(row) {
  if (!row?.id) return row;
  const out = { ...row };
  const v = out.thumbnail_url;
  if (typeof v === 'string' && v.startsWith('data:')) {
    const key = episodeImageKey(row.id);
    await idbPutDataUrl(key, v);
    out.thumbnail_url = key;
  }
  return out;
}

export async function hydrateEpisodeImageFields(row) {
  if (!row) return row;
  const out = { ...row };
  const v = out.thumbnail_url;
  if (typeof v === 'string' && v.startsWith('idb://')) {
    try {
      const data = await idbGetDataUrl(v);
      out.thumbnail_url = data || '';
    } catch (e) {
      console.warn('[catalogImageStorage] hydrateEpisodeImageFields', e);
      out.thumbnail_url = '';
    }
  }
  return out;
}

export async function deleteSeriesImagesFromIdb(seriesId) {
  await idbDeleteByPrefix(`idb://series/${seriesId}/`);
}

export async function deleteEpisodeImageFromIdb(episodeId) {
  await idbDeleteByPrefix(`idb://episode/${episodeId}/`);
}
