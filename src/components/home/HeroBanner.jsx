import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDE_DURATION = 10000;

export default function HeroBanner({ seriesList }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const items = seriesList?.filter(Boolean) || [];

  useEffect(() => {
    setCurrent(0);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % items.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const series = items[current];

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  return (
    <div className="relative w-full h-[50vh] md:h-[95vh] overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={series.id}
          custom={direction}
          variants={{
            enter: (d) => ({ x: d > 0 ? '8%' : '-8%', opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d) => ({ x: d > 0 ? '-8%' : '8%', opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {series.banner_url ? (
            <img
              src={series.banner_url}
              alt={series.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ imageRendering: 'auto' }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0000] via-[#0F0F0F] to-[#1a1a00]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F]/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 pb-16 md:pb-24 px-4 md:px-12 pr-16 md:pr-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={series.id + '-content'}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
            className="max-w-[75%] md:max-w-2xl"
          >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black leading-tight mb-4 drop-shadow-2xl">
              {series.title}
            </h1>
            {series.description && (
              <p className="text-gray-300 mb-3 leading-snug
                line-clamp-2 text-xs
                md:line-clamp-3 md:text-base md:max-w-lg md:mb-6 md:leading-relaxed">
                {series.description}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Link
                to={`/SeriesDetail?id=${series.id}`}
                className="flex items-center gap-1.5 bg-white text-black px-2.5 py-1.5 md:px-6 md:py-3 rounded-md font-semibold text-xs md:text-base hover:bg-white/90 transition-all shadow-lg"
              >
                <Play className="w-3 h-3 md:w-5 md:h-5 fill-current" />
                Assistir
              </Link>
              <Link
                to={`/SeriesDetail?id=${series.id}`}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-2.5 py-1.5 md:px-6 md:py-3 rounded-md font-semibold text-xs md:text-base hover:bg-white/30 transition-all whitespace-nowrap"
              >
                <Info className="w-3 h-3 md:w-5 md:h-5" />
                Mais Informações
              </Link>
            </div>
            <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
              {series.year && <span>{series.year}</span>}
              {series.age_rating && (
                <span className="border border-gray-500 px-2 py-0.5 rounded text-gray-300">{series.age_rating}</span>
              )}
              {series.category && <span>{series.category}</span>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>



      {items.length > 1 && (
        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-2 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="relative h-1 rounded-full overflow-hidden transition-all"
              style={{ width: i === current ? 32 : 8, background: 'rgba(255,255,255,0.3)' }}
            >
              {i === current && (
                <motion.div
                  key={current}
                  className="absolute inset-0 bg-white rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}