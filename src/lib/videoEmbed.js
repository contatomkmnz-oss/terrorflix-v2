/**
 * Resolve como reproduzir uma URL de vídeo no player.
 * Aceita Bunny, Drive, MP4/WebM diretos, YouTube, Vimeo, HLS (.m3u8) e qualquer HTTPS em iframe.
 *
 * @returns {{ type: 'bunny-stream' | 'bunny-player' | 'drive' | 'iframe', url: string } | null}
 */

function tryYouTubeEmbed(decoded) {
  try {
    const url = new URL(decoded);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0].split('?')[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = url.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const embedM = url.pathname.match(/\/embed\/([^/?]+)/);
      if (embedM) return `https://www.youtube.com/embed/${embedM[1]}`;
      const shortM = url.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortM) return `https://www.youtube.com/embed/${shortM[1]}`;
      const liveM = url.pathname.match(/\/live\/([^/?]+)/);
      if (liveM) return `https://www.youtube.com/embed/${liveM[1]}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function tryVimeoEmbed(decoded) {
  try {
    const url = new URL(decoded);
    if (!url.hostname.includes('vimeo.com')) return null;
    if (url.hostname.startsWith('player.')) return decoded.split('#')[0];
    const m = url.pathname.match(/\/(?:video\/)?(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  } catch {
    /* ignore */
  }
  return null;
}

export function getVideoEmbedUrl(url) {
  if (!url) return null;

  let u = String(url).trim();
  if (u && !/^https?:\/\//i.test(u) && /^[\w.-]+\.[a-z]{2,}/i.test(u)) {
    u = `https://${u}`;
  }
  const iframeSrcMatch = u.match(/\ssrc=["']([^"']+)["']/i);
  if (iframeSrcMatch) u = iframeSrcMatch[1];

  let decoded;
  try {
    decoded = decodeURIComponent(u);
  } catch {
    decoded = u;
  }

  const lower = decoded.toLowerCase();

  // Bunny Stream — player embutido (iframe)
  if (
    lower.includes('mediadelivery.net') ||
    lower.includes('player.mediadelivery.net') ||
    lower.includes('iframe.mediadelivery.net')
  ) {
    let out = decoded;
    if (/\/play\//i.test(out)) {
      out = out.replace(/\/play\//i, '/embed/');
    }
    return { type: 'bunny-player', url: out };
  }

  // Bunny CDN / Stream — MP4, WebM, HLS em domínio Bunny
  if (lower.includes('b-cdn.net') || lower.includes('bunnycdn.com')) {
    return { type: 'bunny-stream', url: decoded };
  }

  // Ficheiros directos (compatível com <video>)
  if (/\.(mp4|webm|ogg|ogv|mov)(\?|#|$)/i.test(decoded)) {
    return { type: 'bunny-stream', url: decoded };
  }

  // HLS / DASH — <video> (Safari m3u8 nativo; outros browsers podem variar)
  if (/\.(m3u8|mpd)(\?|#|$)/i.test(decoded)) {
    return { type: 'bunny-stream', url: decoded };
  }

  const driveMatch = decoded.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return { type: 'drive', url: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  if (decoded.includes('drive.google.com')) {
    return { type: 'drive', url: decoded };
  }

  // YouTube / Vimeo — normalizar para embed
  const yt = tryYouTubeEmbed(decoded);
  if (yt) return { type: 'iframe', url: yt };

  const vm = tryVimeoEmbed(decoded);
  if (vm) return { type: 'iframe', url: vm };

  // Qualquer URL http(s) — iframe (players de terceiros, páginas de embed, etc.)
  if (/^https?:\/\//i.test(decoded)) {
    return { type: 'iframe', url: decoded };
  }

  return null;
}
