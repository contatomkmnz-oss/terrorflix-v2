import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SeriesCard from './SeriesCard';

export default function SeriesCarousel({ title, series, myListIds, onToggleList, category, episodes = [], hideComingSoon = false, hideComingSoonIds = new Set() }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!series || series.length === 0) return null;

  return (
    <div className="relative group/carousel mb-8 md:mb-12">
      <div className="flex items-center justify-between px-4 md:px-12 mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold">{title}</h2>
        {category && (
          <Link
            to={`/Browse?category=${encodeURIComponent(category)}`}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Ver Todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 md:w-14 flex items-center justify-center bg-gradient-to-r from-[#0F0F0F] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity"
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
              hideComingSoon={hideComingSoon || hideComingSoonIds.has(s.id)}
            />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 md:w-14 flex items-center justify-center bg-gradient-to-l from-[#0F0F0F] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      </div>
    </div>
  );
}