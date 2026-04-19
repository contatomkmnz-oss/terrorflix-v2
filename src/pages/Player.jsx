import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, SkipForward, List, X, Lock } from 'lucide-react';
import { getVideoEmbedUrl } from '@/lib/videoEmbed';
import { isMovie, getMovieStreamUrl } from '@/constants/contentType';
import { readActiveProfile } from '@/lib/activeProfile';
import { publicAssetUrl } from '@/lib/publicAssetUrl';
import { CATALOG_PREMIUM_UNLOCK_HREF, isPremiumCatalogLocked, formatPremiumUnlockCta } from '@/lib/catalogPremiumLock';
import { formatMediaDurationSeconds } from '@/lib/formatMediaDuration';

export default function Player() {
  const params = new URLSearchParams(window.location.search);
  const episodeId = params.get('episodeId');
  const seriesIdParam = params.get('seriesId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeProfile = readActiveProfile();
  const progressInterval = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState(null);

  const { data: episode, isLoading: episodeLoading } = useQuery({
    queryKey: ['episode', episodeId],
    queryFn: async () => {
      const list = await base44.entities.Episode.filter({ id: episodeId });
      return list[0];
    },
    enabled: !!episodeId,
  });

  const seriesIdForQuery = episode?.series_id ?? (seriesIdParam && !episodeId ? seriesIdParam : null);

  const { data: series, isLoading: seriesLoading } = useQuery({
    queryKey: ['series', seriesIdForQuery],
    queryFn: async () => {
      const list = await base44.entities.Series.filter({ id: seriesIdForQuery });
      return list[0];
    },
    enabled: !!seriesIdForQuery,
  });

  /** Filmes: permite URL em `movie_url` ou no episódio (`video_url`). */
  const sidForEps = episode?.series_id ?? seriesIdParam ?? null;
  const { data: allEpisodes = [], isPending: episodesPending } = useQuery({
    queryKey: ['seriesEpisodes', sidForEps],
    queryFn: () =>
      sidForEps ? base44.entities.Episode.filter({ series_id: sidForEps }) : Promise.resolve([]),
    enabled: !!sidForEps,
  });

  const movieStreamResolved = useMemo(() => {
    if (!series || !isMovie(series)) return '';
    return getMovieStreamUrl(series, allEpisodes);
  }, [series, allEpisodes]);

  const isMoviePlayback = Boolean(
    seriesIdParam && !episodeId && series && isMovie(series) && movieStreamResolved
  );

  const { data: existingHistory = [] } = useQuery({
    queryKey: ['watchHistoryEp', activeProfile?.id, episodeId],
    queryFn: () => base44.entities.WatchHistory.filter({ profile_id: activeProfile.id, episode_id: episodeId }),
    enabled: !!activeProfile?.id && !!episodeId,
  });

  const saveHistoryMut = useMutation({
    mutationFn: async (data) => {
      if (existingHistory.length > 0) {
        await base44.entities.WatchHistory.update(existingHistory[0].id, data);
      } else {
        await base44.entities.WatchHistory.create({
          profile_id: activeProfile.id,
          episode_id: episodeId,
          series_id: episode?.series_id,
          ...data,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchHistoryEp'] }),
  });

  const sortedEpisodes = useMemo(() =>
    [...allEpisodes].sort((a, b) => {
      if ((a.season || 1) !== (b.season || 1)) return (a.season || 1) - (b.season || 1);
      return (a.number || 0) - (b.number || 0);
    }),
    [allEpisodes]
  );

  const currentIndex = sortedEpisodes.findIndex(e => e.id === episodeId);
  const nextEpisode = currentIndex >= 0 && currentIndex < sortedEpisodes.length - 1
    ? sortedEpisodes[currentIndex + 1]
    : null;

  const embedUrl = useMemo(() => {
    if (isMoviePlayback) {
      return getVideoEmbedUrl(getMovieStreamUrl(series, allEpisodes));
    }
    return getVideoEmbedUrl(episode?.video_url);
  }, [isMoviePlayback, series, allEpisodes, episode?.video_url]);

  /** Só ficheiros / streams directos no elemento <video>; resto (Bunny iframe, YouTube, URL genérica) em <iframe>. */
  const useNativeVideo = embedUrl?.type === 'bunny-stream';
  const mediaKey = isMoviePlayback ? `movie-${seriesIdParam}` : episodeId;

  // Autoplay on episode end (só fluxo por episódio)
  useEffect(() => {
    if (isMoviePlayback || !nextEpisode) return;

    const iframe = document.querySelector('#player-container iframe');
    if (!iframe) return;

    const handleVideoEnd = () => {
      let countdown = 3;
      setAutoplayCountdown(countdown);

      const countdownInterval = setInterval(() => {
        countdown--;
        setAutoplayCountdown(countdown);

        if (countdown === 0) {
          clearInterval(countdownInterval);
          navigate(`/Player?episodeId=${nextEpisode.id}`);
        }
      }, 1000);

      return () => clearInterval(countdownInterval);
    };

    const handleMessage = (event) => {
      if (event.origin !== 'https://drive.google.com') return;
      if (event.data === 'video_ended') {
        handleVideoEnd();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isMoviePlayback, nextEpisode, episodeId, navigate]);

  const goToNextEpisode = () => {
    if (nextEpisode) {
      navigate(`/Player?episodeId=${nextEpisode.id}`);
    }
  };

  const needsEpisodeUrlFallback =
    !!seriesIdParam &&
    !episodeId &&
    series &&
    isMovie(series) &&
    !String(series.movie_url || '').trim();

  const waiting =
    (!!episodeId && episodeLoading) ||
    (!!seriesIdForQuery && seriesLoading) ||
    (needsEpisodeUrlFallback && episodesPending);

  if (waiting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (series && isPremiumCatalogLocked(series)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center max-w-md mx-auto">
        <Lock className="w-14 h-14 text-[#FFC107] mb-4" strokeWidth={2} />
        <h1 className="text-xl font-bold text-white mb-2">Conteúdo bloqueado</h1>
        <p className="text-gray-400 text-sm mb-6">
          Este título faz parte do catálogo premium. {formatPremiumUnlockCta(series)} na área de membros.
        </p>
        <Link
          to={CATALOG_PREMIUM_UNLOCK_HREF}
          className="mb-4 px-6 py-2.5 rounded-lg bg-[#FFC107] text-black font-bold text-sm hover:bg-[#FFD54F] transition-colors"
        >
          Ver planos
        </Link>
        <button type="button" onClick={() => navigate(-1)} className="text-[#E50914] hover:underline text-sm">
          Voltar
        </button>
      </div>
    );
  }

  if (episodeId && !episode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-gray-400 px-4">
        <p className="mb-4">Episódio não encontrado.</p>
        <button type="button" onClick={() => navigate(-1)} className="text-[#E50914] hover:underline">Voltar</button>
      </div>
    );
  }

  if (seriesIdParam && !episodeId && !series) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-gray-400 px-4">
        <p className="mb-4">Conteúdo não encontrado.</p>
        <button type="button" onClick={() => navigate(-1)} className="text-[#E50914] hover:underline">Voltar</button>
      </div>
    );
  }

  if (seriesIdParam && !episodeId && series && !isMoviePlayback) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center text-gray-400 px-4 max-w-md">
        <p className="mb-2">
          Este título não tem <strong className="text-white">URL do filme</strong> configurada, ou não é um filme.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Define a URL em Admin → Séries e Filmes (URL do filme) ou em Admin → Episódios (URL do vídeo).
        </p>
        <button type="button" onClick={() => navigate(-1)} className="text-[#E50914] hover:underline">Voltar</button>
      </div>
    );
  }

  if (!isMoviePlayback && episode && !series) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-gray-400 px-4">
        <p className="mb-4">Não foi possível carregar a série.</p>
        <button type="button" onClick={() => navigate(-1)} className="text-[#E50914] hover:underline">Voltar</button>
      </div>
    );
  }

  if (!isMoviePlayback && (!episode || !series)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const episodeDurationLabel =
    !isMoviePlayback && episode ? formatMediaDurationSeconds(episode.duration) : null;

  return (
    <div className="min-h-screen bg-black">
      <div id="player-container" className="relative">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-white hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <div>
              <p className="text-xs text-gray-400">{series?.title}</p>
              <p className="text-sm font-medium">
                {isMoviePlayback
                  ? 'Filme'
                  : `T${episode.season || 1} E${episode.number}: ${episode.title}`}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            {!isMoviePlayback && nextEpisode && (
              <button
                onClick={goToNextEpisode}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-md"
              >
                <SkipForward className="w-4 h-4" />
                Próximo
              </button>
            )}
            {!isMoviePlayback && (
              <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 text-white hover:text-[#E50914] transition-colors">
                <List className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Video */}
        <div className="w-full aspect-video bg-black flex items-center justify-center relative">
          {embedUrl ? (
            useNativeVideo ? (
              <video
                key={mediaKey}
                src={embedUrl.url}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
                {...{
                  'x5-playsinline': 'true',
                  'x5-video-player-type': 'h5',
                  'x5-video-player-fullscreen': 'true',
                }}
                onEnded={() => {
                  if (isMoviePlayback || !nextEpisode) return;
                  let countdown = 3;
                  setAutoplayCountdown(countdown);
                  const countdownInterval = setInterval(() => {
                    countdown--;
                    setAutoplayCountdown(countdown);
                    if (countdown === 0) {
                      clearInterval(countdownInterval);
                      navigate(`/Player?episodeId=${nextEpisode.id}`);
                    }
                  }, 1000);
                }}
              />
            ) : (
              <iframe
                key={mediaKey}
                title="Reprodutor de vídeo"
                src={embedUrl.url}
                className="w-full h-full"
                frameBorder="0"
                scrolling="no"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture; gyroscope; accelerometer; clipboard-write"
                allowFullScreen
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                {...{
                  'x5-playsinline': 'true',
                  'x5-video-player-fullscreen': 'true',
                }}
              />
            )
          ) : (
            <div className="text-center">
              <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">
                {isMoviePlayback ? 'Nenhum vídeo disponível para este filme.' : 'Nenhum vídeo disponível para este episódio.'}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Cola qualquer URL HTTPS de vídeo (Bunny, YouTube, Vimeo, .mp4, .m3u8, Drive, página de embed, etc.).
              </p>
            </div>
          )}

          {/* Autoplay Countdown */}
          {!isMoviePlayback && autoplayCountdown !== null && nextEpisode && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-40 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-gray-300 mb-4">Próximo episódio em</p>
                <div className="text-6xl font-bold text-[#E50914] mb-6">{autoplayCountdown}</div>
                <p className="text-white mb-2">T{nextEpisode.season || 1} E{nextEpisode.number}: {nextEpisode.title}</p>
                <button
                  onClick={() => setAutoplayCountdown(null)}
                  className="inline-flex items-center gap-2 mt-6 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Episode sidebar — só episódios */}
      {!isMoviePlayback && showSidebar && (
        <div className="fixed top-0 right-0 bottom-0 w-80 bg-[#1A1A1A] z-30 overflow-y-auto shadow-2xl border-l border-white/5">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white">Episódios</h3>
            <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="divide-y divide-white/5">
            {sortedEpisodes.map(ep => (
              <Link
                key={ep.id}
                to={`/Player?episodeId=${ep.id}`}
                onClick={() => setShowSidebar(false)}
                className={`flex gap-3 p-3 hover:bg-white/5 transition-colors ${ep.id === episodeId ? 'bg-white/10 border-l-2 border-[#E50914]' : ''}`}
              >
                <div className="shrink-0 w-24 aspect-video rounded overflow-hidden bg-[#2A2A2A]">
                  {(ep.thumbnail_url || series?.cover_url) ? (
                    <img src={publicAssetUrl(ep.thumbnail_url || series?.cover_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Play className="w-4 h-4 text-gray-600" /></div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">T{ep.season || 1} E{ep.number}</p>
                  <p className="text-sm font-medium text-white truncate">{ep.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Info below player */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isMoviePlayback ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">{series.title}</h2>
            <p className="text-sm text-[#E50914] font-semibold mb-4 uppercase tracking-wide">Filme</p>
            {series.description && <p className="text-gray-300 leading-relaxed">{series.description}</p>}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">{episode.title}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
              <span>Temporada {episode.season || 1}</span>
              <span>Episódio {episode.number}</span>
              {episodeDurationLabel && (
                <span className="tabular-nums">{episodeDurationLabel}</span>
              )}
            </div>
            {episode.description && <p className="text-gray-300 leading-relaxed">{episode.description}</p>}

            {nextEpisode && (
              <button
                onClick={goToNextEpisode}
                className="inline-flex items-center gap-2 mt-6 bg-[#E50914] hover:bg-[#FF3D3D] text-white px-6 py-3 rounded-md font-semibold transition-colors"
              >
                <SkipForward className="w-5 h-5" />
                Próximo: {nextEpisode.title}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
