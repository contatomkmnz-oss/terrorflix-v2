import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function ContinueWatching({ history, episodes, allSeries, profileName }) {
  if (!history || history.length === 0) return null;

  const items = history
    .filter(h => !h.completed)
    .slice(0, 10)
    .map(h => {
      const ep = episodes.find(e => e.id === h.episode_id);
      const series = ep ? allSeries.find(s => s.id === ep.series_id) : null;
      if (!ep || !series) return null;
      const progress = h.total_duration > 0 ? (h.watched_seconds / h.total_duration) * 100 : 0;
      return { ...h, episode: ep, series, progress };
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="mb-8 md:mb-10">
      <h2 className="text-base md:text-lg font-semibold mb-3 px-4 md:px-12 text-white">
        {profileName ? `Continuar assistindo como ${profileName}` : 'Continuar Assistindo'}
      </h2>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 md:px-12 pb-2">
        {items.map(item => (
          <Link
            key={item.id}
            to={`/Player?episodeId=${item.episode.id}`}
            className="shrink-0 w-[240px] md:w-[280px] group relative"
          >
            <div className="relative aspect-video rounded-sm overflow-hidden bg-[#1A1A1A]">
              {item.episode.thumbnail_url || item.series.cover_url ? (
                <img
                  src={item.episode.thumbnail_url || item.series.cover_url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E50914]/20 to-[#1A1A1A] flex items-center justify-center">
                  <Play className="w-10 h-10 text-white/40" />
                </div>
              )}
              {/* Dark overlay on hover with play button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                </div>
              </div>
              {/* Progress bar - Netflix style red thick bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-600/80">
                <div className="h-full bg-[#E50914]" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
            {/* Series title below with episode info */}
            <div className="mt-1.5 px-0.5">
              <p className="text-xs text-gray-400 truncate">{item.series.title}</p>
              <p className="text-sm font-medium text-white truncate">
                T{item.episode.season || 1} E{item.episode.number}: {item.episode.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}