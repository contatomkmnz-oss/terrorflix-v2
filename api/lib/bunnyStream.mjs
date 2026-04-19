/**
 * Bunny Stream (Video Library) — chamadas REST no servidor.
 * Credenciais: BUNNY_STREAM_LIBRARY_ID + BUNNY_STREAM_API_KEY (nunca no browser).
 * @see https://docs.bunny.net/reference/bunnynet-api-overview
 */

const BUNNY_VIDEO_API = 'https://video.bunnycdn.com';

export function getBunnyStreamConfig() {
  const libraryId = String(process.env.BUNNY_STREAM_LIBRARY_ID || '').trim();
  const apiKey = String(process.env.BUNNY_STREAM_API_KEY || '').trim();
  const cdnHostname = String(process.env.BUNNY_STREAM_CDN_HOSTNAME || '').trim();
  if (!libraryId || !apiKey) return null;
  return { libraryId, apiKey, cdnHostname: cdnHostname || null };
}

function headers(apiKey) {
  return {
    AccessKey: apiKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

async function bunnyJson(cfg, path, init = {}) {
  const url = `${BUNNY_VIDEO_API}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...headers(cfg.apiKey), ...init.headers },
  });
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  if (!res.ok) {
    const msg =
      (body && (body.message || body.Message || body.error)) || res.statusText || 'Bunny API error';
    const err = new Error(String(msg));
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/**
 * Lista vídeos da biblioteca (paginação Bunny).
 * @param {string} [opts.collection] — UUID da coleção (Stream); filtra só vídeos dessa coleção.
 * @param {string} [opts.search]
 * @param {string} [opts.orderBy] — ex.: `date` (default Bunny)
 */
export async function listBunnyVideos(
  cfg,
  { page = 1, itemsPerPage = 50, collection, search, orderBy } = {}
) {
  const { libraryId } = cfg;
  const q = new URLSearchParams({
    page: String(page),
    itemsPerPage: String(Math.min(100, Math.max(1, itemsPerPage))),
  });
  const coll = String(collection || '').trim();
  if (coll) q.set('collection', coll);
  const s = String(search || '').trim();
  if (s) q.set('search', s);
  const ob = String(orderBy || '').trim();
  if (ob) q.set('orderBy', ob);
  return bunnyJson(cfg, `/library/${libraryId}/videos?${q}`, { method: 'GET' });
}

/** Cria entrada de vídeo (vazio) — depois use upload TUS ou painel Bunny. */
export async function createBunnyVideo(cfg, { title }) {
  const { libraryId } = cfg;
  return bunnyJson(cfg, `/library/${libraryId}/videos`, {
    method: 'POST',
    body: JSON.stringify({ title: String(title || 'Sem título') }),
  });
}

/** Detalhe de um vídeo por GUID. */
export async function getBunnyVideo(cfg, videoId) {
  const { libraryId } = cfg;
  const id = encodeURIComponent(String(videoId).trim());
  return bunnyJson(cfg, `/library/${libraryId}/videos/${id}`, { method: 'GET' });
}

/** URL do player iframe (Stream) — pública, sem API key. */
export function bunnyStreamEmbedUrl(libraryId, videoGuid) {
  const lib = encodeURIComponent(String(libraryId).trim());
  const guid = encodeURIComponent(String(videoGuid).trim());
  return `https://iframe.mediadelivery.net/embed/${lib}/${guid}`;
}

/** URL CDN directa típica (MP4) quando o hostname da pull zone é conhecido. */
export function bunnyCdnMp4Url(cdnHostname, pathLeadingSlash) {
  const host = String(cdnHostname || '').replace(/\/$/, '');
  const path = String(pathLeadingSlash || '').startsWith('/')
    ? pathLeadingSlash
    : `/${pathLeadingSlash}`;
  if (!host) return null;
  return `https://${host}${path}`;
}
