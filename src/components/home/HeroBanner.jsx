import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { publicAssetUrl } from '@/lib/publicAssetUrl';

/** Troca automática de banner a cada 6s; ao mudar de slide manualmente, o cronómetro reinicia. */
const SLIDE_DURATION_MS = 6000;
const SWIPE_THRESHOLD_PX = 48;

/**
 * Hero da home — usa apenas `slides` normalizados (ver `heroBanners.js`).
 * Não lê catálogo, localStorage nem FeaturedBanner.
 */
export default function HeroBanner({ slides = [] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const pointerStartX = useRef(null);

  const items = slides.filter(Boolean);

  useEffect(() => {
    setCurrent(0);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % items.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [items.length, current]);

  if (!items.length) return null;

  const slide = items[current];
  const bannerSrc = slide.banner_image;
  const slideVisualKey = `${slide.id}-${slide._image_version ?? ''}`;
  const showPlay = slide.playHref != null && String(slide.playHref).length > 0;
  const detailIsExternal =
    slide.detailHref && /^https?:\/\//i.test(String(slide.detailHref));

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const goNext = () => {
    if (items.length <= 1) return;
    setDirection(1);
    setCurrent((prev) => (prev + 1) % items.length);
  };

  const goPrev = () => {
    if (items.length <= 1) return;
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + items.length) % items.length);
  };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerStartX.current = e.clientX;
  };

  const onPointerUp = (e) => {
    if (pointerStartX.current == null || items.length <= 1) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (dx > 0) goPrev();
    else goNext();
  };

  const onPointerCancel = () => {
    pointerStartX.current = null;
  };

  const AssistirBtn =
    showPlay &&
    (slide.playExternal ? (
      <a
        href={slide.playHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan text-white px-2.5 py-1.5 md:px-6 md:py-3 rounded-md font-semibold text-xs md:text-base hover:opacity-95 transition-all shadow-[0_0_28px_-6px_rgba(232,121,249,0.55)]"
      >
        <Play className="w-3 h-3 md:w-5 md:h-5 fill-current" />
        Assistir
      </a>
    ) : (
      <Link
        to={slide.playHref}
        className="flex items-center gap-1.5 bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan text-white px-2.5 py-1.5 md:px-6 md:py-3 rounded-md font-semibold text-xs md:text-base hover:opacity-95 transition-all shadow-[0_0_28px_-6px_rgba(232,121,249,0.55)]"
      >
        <Play className="w-3 h-3 md:w-5 md:h-5 fill-current" />
        Assistir
      </Link>
    ));

  const MaisInfoBtn =
    slide.detailHref &&
    (detailIsExternal ? (
      <a
        href={slide.detailHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white border border-neon-cyan/35 px-2.5 py-1.5 md:px-6 md:py-3 rounded-md font-semibold text-xs md:text-base hover:bg-neon-cyan/15 hover:border-neon-cyan/55 transition-all whitespace-nowrap shadow-[0_0_20px_-8px_rgba(34,211,238,0.35)]"
      >
        <Info className="w-3 h-3 md:w-5 md:h-5" />
        Mais Informações
      </a>
    ) : (
      <Link
        to={slide.detailHref}
        className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white border border-neon-cyan/35 px-2.5 py-1.5 md:px-6 md:py-3 rounded-md font-semibold text-xs md:text-base hover:bg-neon-cyan/15 hover:border-neon-cyan/55 transition-all whitespace-nowrap shadow-[0_0_20px_-8px_rgba(34,211,238,0.35)]"
      >
        <Info className="w-3 h-3 md:w-5 md:h-5" />
        Mais Informações
      </Link>
    ));

  return (
    <div
      className="relative w-full h-[50vh] md:h-[95vh] overflow-hidden select-none"
      style={{ touchAction: 'manipulation' }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerCancel}
      onPointerCancel={onPointerCancel}
      role="region"
      aria-label="Destaques — arraste horizontalmente para mudar de banner"
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={slideVisualKey}
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
          className="absolute inset-0 pointer-events-none"
        >
          {bannerSrc ? (
            <img
              key={slideVisualKey}
              src={publicAssetUrl(bannerSrc)}
              alt={slide.title}
              className="absolute inset-0 z-0 w-full h-full object-cover"
              style={{
                imageRendering: 'auto',
                objectPosition: slide.banner_object_position || 'center center',
              }}
            />
          ) : (
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-neon-fuchsia/15 via-[#050508] to-neon-cyan/12" />
          )}
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#050508]/55 via-[#050508]/22 to-transparent pointer-events-none" />
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#050508]/48 via-[#050508]/12 to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 z-20 pb-16 md:pb-24 px-4 md:px-12 pr-16 md:pr-12 pointer-events-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideVisualKey + '-content'}
            initial={{ y: 16, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-[75%] md:max-w-2xl text-white opacity-100"
            style={{ opacity: 1 }}
          >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black leading-tight mb-4 text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85),0_0_40px_rgba(232,121,249,0.25)]">
              {slide.title}
            </h1>
            {slide.description && (
              <p
                className="text-gray-100 mb-3 leading-snug
                line-clamp-2 text-xs
                md:line-clamp-3 md:text-base md:max-w-lg md:mb-6 md:leading-relaxed drop-shadow-md"
              >
                {slide.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {AssistirBtn}
              {MaisInfoBtn}
            </div>
            <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
              {slide.year !== '' && slide.year != null && <span>{slide.year}</span>}
              {slide.rating && (
                <span className="border border-neon-cyan/40 px-2 py-0.5 rounded text-neon-cyan/95">{slide.rating}</span>
              )}
              {slide.category && <span>{slide.category}</span>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-2 z-10">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              className="relative h-1 rounded-full overflow-hidden transition-all"
              style={{ width: i === current ? 32 : 8, background: 'rgba(167,139,250,0.25)' }}
            >
              {i === current && (
                <motion.div
                  key={current}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-fuchsia to-neon-cyan"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: SLIDE_DURATION_MS / 1000, ease: 'linear' }}
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
