import React, { useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SeriesCard from './SeriesCard';

export default function SeriesCarousel({
  title,
  series,
  myListIds,
  onToggleList,
  /** Filtro por texto em `category` da série (Browse ?category=) */
  category,
  /** Caminho completo para «Ver Todos» (ex.: seção por highlight) */
  browseTo,
  episodes = [],
  /** Avanço automático horizontal (ms). Pausa ao passar o rato na faixa. */
  autoAdvanceMs,
  pauseAutoAdvanceOnHover = true,
  showHeader = true,
  className = '',
}) {
  const scrollRef = useRef(null);
  const pauseRef = useRef(false);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const scrollOneStep = useCallback(() => {
    const el = scrollRef.current;
    if (!el || pauseRef.current) return;
    const first = el.children[0];
    const cardW = first?.offsetWidth ?? 200;
    const gap =
      first && el.children[1]
        ? el.children[1].offsetLeft - first.offsetLeft - cardW
        : 12;
    const step = cardW + Math.max(0, gap);
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: step, behavior: 'smooth' });
    }
  }, []);

  const seriesIdsKey = series?.map((s) => s.id).join('|') ?? '';

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
  }, [seriesIdsKey]);

  useEffect(() => {
    if (!autoAdvanceMs || !series?.length) return;
    const id = setInterval(() => scrollOneStep(), autoAdvanceMs);
    return () => clearInterval(id);
  }, [autoAdvanceMs, seriesIdsKey, series?.length, scrollOneStep]);

  if (!series || series.length === 0) return null;

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

  return (
    <div
      className={`relative group/carousel mb-8 md:mb-12 ${className}`.trim()}
      onMouseEnter={() => {
        if (pauseAutoAdvanceOnHover) pauseRef.current = true;
      }}
      onMouseLeave={() => {
        if (pauseAutoAdvanceOnHover) pauseRef.current = false;
      }}
    >
      {header}
      <div className="relative">
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 md:w-14 flex items-center justify-center bg-gradient-to-r from-[#050508] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-3 overflow-x-auto hide-scrollbar px-4 md:px-12 pb-4"
        >
          {series.map(s => (
            <SeriesCard
              key={s.id}
              series={s}
              isInList={myListIds?.includes(s.id)}
              onToggleList={onToggleList}
              episodes={episodes}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Seguinte"
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 md:w-14 flex items-center justify-center bg-gradient-to-l from-[#050508] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      </div>
    </div>
  );
}
