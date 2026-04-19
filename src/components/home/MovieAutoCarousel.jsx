import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SeriesCard from './SeriesCard';

/**
 * Faixa de capas de filme em loop infinito (CSS).
 * `direction`: "left" = fluxo para a esquerda; "right" = inverte a animação (fluxo oposto).
 */
export default function MovieAutoCarousel({
  title,
  movies = [],
  myListIds,
  onToggleList,
  episodes = [],
  browseTo,
  category,
  showHeader = true,
  className = '',
  /** Direção do movimento contínuo (alternar entre fileiras na home). */
  direction = 'left',
}) {
  const loopItems = useMemo(() => {
    if (!movies?.length) return [];
    const seen = new Set();
    return movies.filter((s) => {
      const id = s?.id;
      if (id == null || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [movies]);

  const durationSec = Math.max(28, movies.length * 9);

  if (!movies?.length) return null;

  const header = showHeader ? (
    <div className="flex items-center justify-between px-4 md:px-12 mb-3 md:mb-4">
      <h2 className="text-lg md:text-xl font-bold members-heading-gradient">{title}</h2>
      {(browseTo || category) && (
        <Link
          to={browseTo || `/Browse?category=${encodeURIComponent(category)}`}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-neon-cyan transition-colors"
        >
          Ver Todos
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  ) : null;

  const trackClass =
    `movie-marquee-track flex gap-2 md:gap-3 ${direction === 'right' ? 'movie-marquee-track--reverse' : ''}`.trim();

  return (
    <div className={`relative mb-8 md:mb-12 ${className}`.trim()}>
      {header}
      <div className="min-w-0 px-4 md:px-12 pb-4">
        <div
          className="movie-marquee-wrap"
          role="region"
          aria-label={title || 'Filmes'}
        >
          <div
            className={trackClass}
            style={{ animationDuration: `${durationSec}s` }}
          >
            {loopItems.map((s) => (
              <div key={s.id} className="shrink-0">
                <SeriesCard
                  series={s}
                  isInList={myListIds?.includes(s.id)}
                  onToggleList={onToggleList}
                  episodes={episodes}
                  inMarquee
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
