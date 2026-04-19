import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { isMovie } from '@/constants/contentType';
import { getItemsForNetflixRow } from '@/lib/netflixHomeRows';
import { useShuffledMovies } from '@/hooks/useShuffledMovies';
import MovieAutoCarousel from './MovieAutoCarousel';
import SeriesCarousel from './SeriesCarousel';

/**
 * Uma fileira Netflix: filmes (marquee contínuo; direção alterna com `rowIndex`) e séries (carrossel).
 */
function NetflixHomeRow({
  slug,
  label,
  visibleSeries,
  myListIds,
  onToggleList,
  episodes,
  /** Índice da linha na home — ímpar/par define sentido oposto no marquee de filmes. */
  rowIndex = 0,
}) {
  const location = useLocation();
  const list = useMemo(
    () => getItemsForNetflixRow(visibleSeries, label),
    [visibleSeries, label]
  );
  const movies = useMemo(() => list.filter(isMovie), [list]);
  const seriesRow = useMemo(() => list.filter((s) => !isMovie(s)), [list]);
  const shuffledMovies = useShuffledMovies(movies, location.key);

  if (list.length === 0) return null;

  const header = (
    <div className="flex items-center justify-between px-4 md:px-12 mb-3 md:mb-4">
      <h2 className="text-lg md:text-xl font-bold members-heading-gradient">{label}</h2>
      <Link
        to={`/Browse?section=${encodeURIComponent(slug)}`}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-neon-cyan transition-colors"
      >
        Ver Todos
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <div className="mb-8 md:mb-12">
      {header}
      <div
        className={
          movies.length > 0 && seriesRow.length > 0 ? 'space-y-4' : ''
        }
      >
        {movies.length > 0 && (
          <MovieAutoCarousel
            key={`mrow-${slug}-${movies.map((m) => m.id).sort().join(',')}`}
            showHeader={false}
            title={label}
            movies={shuffledMovies}
            myListIds={myListIds}
            onToggleList={onToggleList}
            episodes={episodes}
            className="!mb-0"
            direction={rowIndex % 2 === 0 ? 'left' : 'right'}
          />
        )}
        {seriesRow.length > 0 && (
          <SeriesCarousel
            showHeader={false}
            title={label}
            series={seriesRow}
            myListIds={myListIds}
            onToggleList={onToggleList}
            browseTo={`/Browse?section=${encodeURIComponent(slug)}`}
            episodes={episodes}
            className="!mb-0"
          />
        )}
      </div>
    </div>
  );
}

export default React.memo(NetflixHomeRow);
