/**
 * Formata duração em segundos como no leitor de vídeo (mm:ss ou h:mm:ss).
 * @param {number|string|undefined|null} totalSeconds
 * @returns {string|null}
 */
export function formatMediaDurationSeconds(totalSeconds) {
  const n = Math.round(Number(totalSeconds));
  if (!Number.isFinite(n) || n <= 0) return null;
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  const pad = (x) => String(x).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

/** URL que o browser consegue abrir em &lt;video&gt; para ler metadata (duração). */
export function isDirectVideoUrlForProbe(url) {
  if (typeof url !== 'string') return false;
  const u = url.trim();
  if (!u || u.startsWith('blob:')) return false;
  if (/youtube\.com|youtu\.be|vimeo\.com|mediadelivery\.net/i.test(u)) return false;
  if (/drive\.google\.com/i.test(u)) return false;
  return /\.(mp4|webm|ogg|ogv|m4v)(\?|#|$)/i.test(u);
}

/**
 * Lê duração via elemento &lt;video&gt; (metadata). Pode falhar por CORS ou URL não reproduzível.
 * @param {string} url
 * @returns {Promise<number>} segundos arredondados
 */
export function probeVideoDurationSeconds(url) {
  return new Promise((resolve, reject) => {
    const src = String(url || '').trim();
    if (!src) {
      reject(new Error('URL vazia'));
      return;
    }
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    const done = () => {
      v.removeAttribute('src');
      v.src = '';
      v.load();
    };
    const t = window.setTimeout(() => {
      done();
      reject(new Error('Tempo esgotado ao ler o vídeo'));
    }, 25000);
    v.onloadedmetadata = () => {
      window.clearTimeout(t);
      const d = v.duration;
      done();
      if (Number.isFinite(d) && d > 0) resolve(Math.round(d));
      else reject(new Error('Duração indisponível'));
    };
    v.onerror = () => {
      window.clearTimeout(t);
      done();
      reject(new Error('Não foi possível ler o vídeo (rede, CORS ou formato)'));
    };
    v.src = src;
  });
}
