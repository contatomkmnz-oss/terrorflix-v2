import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { isMovie, getMovieStreamUrl } from '@/constants/contentType';
import { imageUrlWithCacheBust } from '@/lib/imageCacheBust';
import { publicAssetUrl } from '@/lib/publicAssetUrl';
import { seriesDetailHref } from '@/lib/seriesRoutes';
import {
  CATALOG_PREMIUM_UNLOCK_HREF,
  isPremiumCatalogLocked,
  formatPremiumUnlockCta,
} from '@/lib/catalogPremiumLock';

export default function SeriesCard({
  series,
  isInList,
  onToggleList,
  episodes = [],
  /** Dentro do carrossel CSS (marquee): sem Framer scale no wrapper — evita conflito com transform da faixa. */
  inMarquee = false,
}) {
  const [hovered, setHovered] = useState(false);
  const [coverBroken, setCoverBroken] = useState(false);

  useEffect(() => {
    setCoverBroken(false);
  }, [series.id, series.cover_url]);

  const movieStreamUrl = getMovieStreamUrl(series, episodes);
  const filmePronto = isMovie(series) && !!movieStreamUrl;
  const premiumLocked = isPremiumCatalogLocked(series);
  const detailHref = seriesDetailHref(series);
  const posterHref = premiumLocked ? CATALOG_PREMIUM_UNLOCK_HREF : detailHref;
  const playHref = premiumLocked
    ? CATALOG_PREMIUM_UNLOCK_HREF
    : filmePronto
      ? `/Player?seriesId=${series.id}`
      : detailHref;

  const shellClass =
    'relative shrink-0 w-[140px] md:w-[200px] lg:w-[240px] group cursor-pointer';

  const Shell = inMarquee ? 'div' : motion.div;
  const shellProps = inMarquee
    ? {
        className: shellClass,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {
        className: shellClass,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        whileHover: { scale: 1.05, zIndex: 10 },
        transition: { duration: 0.2 },
      };

  return (
    <Shell {...shellProps}>
      <Link to={posterHref}>
        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1A1A1A] shadow-lg relative">
          {series.cover_url ? (
            <img
              key={`${series.id}-${series.updated_date || ''}-${coverBroken ? 'fb' : 'ok'}`}
              src={
                coverBroken
                  ? publicAssetUrl('/imagens/banners/poster-movie.svg')
                  : imageUrlWithCacheBust(series.cover_url, series)
              }
              alt={series.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setCoverBroken(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-fuchsia/35 to-member-elevated p-3">
              <span className="text-sm font-bold text-center text-white/80">{series.title}</span>
            </div>
          )}
          {premiumLocked && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20 flex flex-col items-center justify-center gap-2 px-2 text-center pointer-events-none">
              <div className="rounded-full bg-black/55 p-2.5 ring-2 ring-[#FFC107]/80 shadow-[0_0_20px_-4px_rgba(255,193,7,0.5)]">
                <Lock className="w-6 h-6 md:w-7 md:h-7 text-[#FFC107]" strokeWidth={2.25} />
              </div>
              <span className="text-[10px] md:text-xs font-bold text-white leading-tight drop-shadow-md max-w-[11rem]">
                {formatPremiumUnlockCta(series)}
              </span>
            </div>
          )}
        </div>
      </Link>

      {hovered && (() => {
        const hoverPanelBody = (
          <div className="bg-member-elevated/95 rounded-b-lg p-3 shadow-2xl border-t border-neon-cyan/35">
            <p className="text-xs font-semibold text-white truncate mb-2">{series.title}</p>
            <div className="flex items-center gap-2">
              <Link
                to={playHref}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-fuchsia to-neon-cyan flex items-center justify-center hover:opacity-95 transition-opacity shadow-[0_0_12px_-2px_rgba(232,121,249,0.5)]"
                title={premiumLocked ? formatPremiumUnlockCta(series) : undefined}
              >
                {premiumLocked ? (
                  <Lock className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                )}
              </Link>
              {onToggleList && (
                <button
                  onClick={(e) => { e.preventDefault(); onToggleList(series.id); }}
                  className="w-7 h-7 rounded-full border border-gray-500 flex items-center justify-center hover:border-white transition-colors"
                >
                  {isInList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        );
        const wrapClass = 'absolute -bottom-2 left-0 right-0 px-2 pb-2';
        return inMarquee ? (
          <div className={wrapClass}>{hoverPanelBody}</div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={wrapClass}
          >
            {hoverPanelBody}
          </motion.div>
        );
      })()}
    </Shell>
  );
}