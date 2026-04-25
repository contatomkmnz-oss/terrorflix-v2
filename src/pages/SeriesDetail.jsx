import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, CheckCircle2, Lock } from 'lucide-react';

import { motion } from 'framer-motion';

export default function SeriesDetail() {
  const params = new URLSearchParams(window.location.search);
  const seriesId = params.get('id');
  const queryClient = useQueryClient();
  const activeProfile = JSON.parse(localStorage.getItem('desenhos_active_profile') || 'null');
  const [selectedSeason, setSelectedSeason] = useState(1);

  const { data: series } = useQuery({
    queryKey: ['series', seriesId],
    queryFn: async () => {
      const list = await base44.entities.Series.filter({ id: seriesId });
      return list[0];
    },
    enabled: !!seriesId,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ['episodes', seriesId],
    queryFn: () => base44.entities.Episode.filter({ series_id: seriesId }),
    enabled: !!seriesId,
  });

  const { data: myListItems = [] } = useQuery({
    queryKey: ['myList', activeProfile?.id],
    queryFn: () => activeProfile?.id ? base44.entities.MyList.filter({ profile_id: activeProfile.id }) : [],
    enabled: !!activeProfile?.id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['watchHistory', activeProfile?.id, seriesId],
    queryFn: () => activeProfile?.id ? base44.entities.WatchHistory.filter({ profile_id: activeProfile.id, series_id: seriesId }) : [],
    enabled: !!activeProfile?.id && !!seriesId,
  });

  const isInList = myListItems.some(m => m.series_id === seriesId);

  const addMut = useMutation({
    mutationFn: () => base44.entities.MyList.create({ profile_id: activeProfile.id, series_id: seriesId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myList'] }),
  });

  const removeMut = useMutation({
    mutationFn: async () => {
      const item = myListItems.find(m => m.series_id === seriesId);
      if (item) await base44.entities.MyList.delete(item.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myList'] }),
  });

  const seasons = useMemo(() => {
    const s = new Set(episodes.map(e => e.season || 1));
    return Array.from(s).sort((a, b) => a - b);
  }, [episodes]);

  const seasonEpisodes = useMemo(() =>
    episodes
      .filter(e => (e.season || 1) === selectedSeason)
      .sort((a, b) => (a.number || 0) - (b.number || 0)),
    [episodes, selectedSeason]
  );

  const formatDuration = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    return `${m}min`;
  };

  const getEpisodeProgress = (epId) => {
    const h = history.find(h => h.episode_id === epId);
    if (!h || !h.total_duration) return 0;
    return (h.watched_seconds / h.total_duration) * 100;
  };

  const isWatched = (epId) => {
    return history.some(h => h.episode_id === epId && h.completed);
  };

  const markWatchedMut = useMutation({
    mutationFn: async (ep) => {
      const existing = history.find(h => h.episode_id === ep.id);
      if (existing) {
        await base44.entities.WatchHistory.update(existing.id, { completed: !existing.completed, watched_seconds: existing.completed ? existing.watched_seconds : (ep.duration || 0) });
      } else {
        await base44.entities.WatchHistory.create({ profile_id: activeProfile.id, episode_id: ep.id, series_id: seriesId, watched_seconds: ep.duration || 0, total_duration: ep.duration || 0, completed: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchHistory'] }),
  });

  if (!series) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstEp = seasonEpisodes[0];

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Banner — começa do topo (Navbar stack é transparente/sobreposta) */}
      <div className="relative h-[55vh] md:h-[70vh]">
        {series.banner_url ? (
          <img src={series.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : series.cover_url ? (
          <img src={series.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/20 to-[#141414]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 to-transparent" />

        <div className="absolute bottom-10 md:bottom-16 left-0 right-0 px-4 md:px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 drop-shadow-lg">{series.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-300 mb-4 flex-wrap">
              {series.year && <span className="text-[#46D369] font-semibold">{series.year}</span>}
              {seasons.length > 0 && <span>{seasons.length} {seasons.length === 1 ? 'temporada' : 'temporadas'}</span>}
              {series.age_rating && (
                <span className="border border-gray-500 text-gray-300 px-1.5 py-0.5 text-xs rounded">{series.age_rating}</span>
              )}
              {series.category && <span className="text-gray-400 text-xs">{series.category}</span>}
            </div>
            <p className="text-gray-200 max-w-xl text-sm md:text-base leading-relaxed mb-6 line-clamp-3">
              {series.description}
            </p>
            <div className="flex items-center gap-3">
              {firstEp && (
                <Link
                  to={`/Player?episodeId=${firstEp.id}`}
                  className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded font-bold hover:bg-white/85 transition-all text-sm"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Assistir
                </Link>
              )}
              <button
                onClick={() => isInList ? removeMut.mutate() : addMut.mutate()}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded font-medium hover:bg-white/30 transition-all text-sm border border-white/40"
              >
                {isInList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isInList ? 'Na Lista' : 'Minha Lista'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="px-4 md:px-12 py-8 max-w-5xl">
        {/* Header: Episódios + Season dropdown */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-white">Episódios</h2>
          {seasons.length > 1 && (
            <select
              value={selectedSeason}
              onChange={e => setSelectedSeason(Number(e.target.value))}
              className="bg-[#2A2A2A] border border-white/20 text-white px-4 py-2 rounded text-sm font-medium appearance-none"
              style={{ colorScheme: 'dark' }}
            >
              {seasons.map(s => (
                <option key={s} value={s}>Temporada {s}</option>
              ))}
            </select>
          )}
        </div>

        {/* Season label */}
        {seasons.length > 0 && (
          <p className="text-xs text-gray-500 mb-4">
            Temporada {selectedSeason}: {seasonEpisodes.length} episódio{seasonEpisodes.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Episode list — Netflix style */}
        <div className="space-y-1">
          {seasonEpisodes.map((ep, i) => {
            const progress = getEpisodeProgress(ep.id);
            const duration = formatDuration(ep.duration);
            const isLocked = !ep.video_url;

            const rowContent = (
              <>
                {/* Episode number */}
                <div className={`shrink-0 w-8 text-center text-xl font-light transition-colors ${isLocked ? 'text-gray-600' : 'text-gray-500 group-hover:text-white'}`}>
                  {isLocked ? <Lock className="w-4 h-4 mx-auto text-gray-600" /> : (ep.number || i + 1)}
                </div>

                {/* Thumbnail */}
                <div className="shrink-0 w-28 md:w-36 relative">
                  <div className="aspect-video rounded overflow-hidden bg-[#2A2A2A]">
                    {ep.thumbnail_url || series.cover_url ? (
                      <img src={ep.thumbnail_url || series.cover_url} alt="" className={`w-full h-full object-cover transition-transform duration-300 ${!isLocked ? 'group-hover:scale-105' : 'opacity-40'}`} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#333]">
                        {isLocked ? <Lock className="w-5 h-5 text-gray-600" /> : <Play className="w-5 h-5 text-gray-600" />}
                      </div>
                    )}
                    {/* Play overlay — only if not locked */}
                    {!isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center">
                          <Play className="w-4 h-4 text-black fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                    {/* Locked overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-1">
                        <Lock className="w-4 h-4 text-[#FFC107]" />
                        <span className="text-[9px] font-bold text-[#FFC107] text-center leading-tight px-1">EM BREVE</span>
                      </div>
                    )}
                  </div>
                  {/* Progress bar */}
                  {progress > 0 && !isLocked && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-700 rounded-b">
                      <div className="h-full bg-[#E50914] rounded-b" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-semibold text-sm md:text-base leading-snug ${isLocked ? 'text-gray-500' : isWatched(ep.id) ? 'text-gray-400' : 'text-white'}`}>{ep.title}</h3>
                    {isLocked ? (
                      <span className="shrink-0 text-[10px] font-bold text-[#FFC107] bg-[#FFC107]/10 border border-[#FFC107]/30 px-1.5 py-0.5 rounded mt-0.5">INDISPONÍVEL</span>
                    ) : duration && (
                      <span className="shrink-0 text-xs text-gray-400 mt-0.5">{duration}</span>
                    )}
                  </div>
                  {ep.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{ep.description}</p>
                  )}
                  {isLocked && (
                    <p className="text-[10px] text-gray-500 mt-1">Este episódio ainda não está disponível para reprodução.</p>
                  )}
                </div>

                {/* Mark watched button — only if not locked */}
                {activeProfile?.id && !isLocked && (
                  <button
                    onClick={(e) => { e.preventDefault(); markWatchedMut.mutate(ep); }}
                    title={isWatched(ep.id) ? 'Marcar como não assistido' : 'Marcar como assistido'}
                    className={`shrink-0 p-2 rounded-full transition-colors ${isWatched(ep.id) ? 'text-[#46D369] hover:text-gray-400' : 'text-gray-600 hover:text-[#46D369]'}`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
              </>
            );

            return isLocked ? (
              <div
                key={ep.id}
                className="flex items-center gap-4 px-2 py-4 rounded border-b border-white/5 last:border-b-0 opacity-80 cursor-not-allowed group"
              >
                {rowContent}
              </div>
            ) : (
              <Link
                key={ep.id}
                to={`/Player?episodeId=${ep.id}`}
                className="flex items-center gap-4 px-2 py-4 rounded hover:bg-[#2A2A2A] transition-colors group border-b border-white/5 last:border-b-0"
              >
                {rowContent}
              </Link>
            );
          })}

          {seasonEpisodes.length === 0 && (
            <p className="text-center text-gray-500 py-12">Nenhum episódio nesta temporada.</p>
          )}
        </div>
      </div>
    </div>
  );
}