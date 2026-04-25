import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SeriesCard({ series, isInList, onToggleList, episodes = [], hideComingSoon = false }) {
  const [hovered, setHovered] = useState(false);

  const seriesEpisodes = episodes.filter(e => e.series_id === series.id);
  const hasNoEpisodes = seriesEpisodes.length === 0;
  const hasAtLeastOneLink = seriesEpisodes.some(e => !!e.video_url);
  const showComingSoon = !hideComingSoon && (hasNoEpisodes || !hasAtLeastOneLink);

  return (
    <motion.div
      className="relative shrink-0 w-[140px] md:w-[200px] lg:w-[240px] group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/SeriesDetail?id=${series.id}`}>
        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1A1A1A] shadow-lg relative">
          {series.cover_url ? (
            <img
              src={series.cover_url}
              alt={series.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E50914]/30 to-[#1A1A1A] p-3">
              <span className="text-sm font-bold text-center text-white/80">{series.title}</span>
            </div>
          )}
          {showComingSoon && (
            <div className="absolute inset-0 bg-black/60 flex items-end justify-center pb-4">
              <div className="flex flex-col items-center gap-1 px-2 text-center">
                <Clock className="w-4 h-4 text-[#FFC107]" />
                <span className="text-[10px] md:text-xs font-bold text-[#FFC107] leading-tight">
                  EPISÓDIOS EM BREVE
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>

      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-2 left-0 right-0 px-2 pb-2"
        >
          <div className="bg-[#1A1A1A] rounded-b-lg p-3 shadow-2xl border-t border-[#E50914]/30">
            <p className="text-xs font-semibold text-white truncate mb-2">{series.title}</p>
            <div className="flex items-center gap-2">
              <Link
                to={`/SeriesDetail?id=${series.id}`}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-black fill-current ml-0.5" />
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
            <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
              {series.year && <span>{series.year}</span>}
              {series.age_rating && (
                <span className="border border-gray-600 px-1 rounded">{series.age_rating}</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}