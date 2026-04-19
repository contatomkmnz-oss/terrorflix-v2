import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { brand, footer as footerContent } from '@/data/siteContent';
import { CONTINUE_WATCHING_HOME_KEY } from '@/data/netflixRowOrder';
import {
  getEffectiveHomePageRowSequence,
  getEffectiveNetflixHomeRowOrder,
  subscribeHomeRowOrder,
} from '@/lib/homeRowOrderPreference';
import { heroBanners, normalizeHeroSlide, featuredBannerToHeroSlide } from '@/data/heroBanners';
import { seriesToHeroSlide } from '@/lib/heroFromSeries';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HeroBanner from '../components/home/HeroBanner';
import NetflixHomeRow from '../components/home/NetflixHomeRow';
import ContinueWatching from '../components/home/ContinueWatching';
import { readActiveProfile } from '@/lib/activeProfile';

export default function Home() {
  const queryClient = useQueryClient();
  const activeProfile = readActiveProfile();
  const [homeRowTick, setHomeRowTick] = useState(0);
  useEffect(() => subscribeHomeRowOrder(() => setHomeRowTick((t) => t + 1)), []);

  const homePageRowSequence = useMemo(
    () => getEffectiveHomePageRowSequence(),
    [homeRowTick]
  );
  const slugToNetflixRow = useMemo(
    () => Object.fromEntries(getEffectiveNetflixHomeRowOrder().map((r) => [r.slug, r])),
    [homeRowTick]
  );

  const useRealApi = import.meta.env.VITE_USE_REAL_API === 'true';

  const {
    data: allSeries = [],
    isError: seriesError,
    error: seriesQueryError,
    isPending: seriesLoading,
  } = useQuery({
    queryKey: ['series'],
    queryFn: () => base44.entities.Series.filter({ published: true }),
  });

  const { data: featuredBannerRows = [] } = useQuery({
    queryKey: ['featuredBanner'],
    queryFn: () => base44.entities.FeaturedBanner.filter({ active: true }, 'order'),
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ['episodes'],
    queryFn: () => base44.entities.Episode.list('-season', 500),
  });

  const { data: myListItems = [] } = useQuery({
    queryKey: ['myList', activeProfile?.id],
    queryFn: () => activeProfile?.id ? base44.entities.MyList.filter({ profile_id: activeProfile.id }) : [],
    enabled: !!activeProfile?.id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['watchHistory', activeProfile?.id],
    queryFn: () => activeProfile?.id ? base44.entities.WatchHistory.filter({ profile_id: activeProfile.id }, '-updated_date', 20) : [],
    enabled: !!activeProfile?.id,
  });

  const addToListMut = useMutation({
    mutationFn: (seriesId) => base44.entities.MyList.create({ profile_id: activeProfile.id, series_id: seriesId }),
    onMutate: async (seriesId) => {
      await queryClient.cancelQueries({ queryKey: ['myList', activeProfile?.id] });
      const prev = queryClient.getQueryData(['myList', activeProfile?.id]);
      queryClient.setQueryData(['myList', activeProfile?.id], old => [
        ...(old || []),
        { id: `opt-${seriesId}`, profile_id: activeProfile.id, series_id: seriesId },
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(['myList', activeProfile?.id], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['myList'] }),
  });

  const removeFromListMut = useMutation({
    mutationFn: async (seriesId) => {
      const item = myListItems.find(m => m.series_id === seriesId);
      if (item) await base44.entities.MyList.delete(item.id);
    },
    onMutate: async (seriesId) => {
      await queryClient.cancelQueries({ queryKey: ['myList', activeProfile?.id] });
      const prev = queryClient.getQueryData(['myList', activeProfile?.id]);
      queryClient.setQueryData(['myList', activeProfile?.id], old =>
        (old || []).filter(m => m.series_id !== seriesId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(['myList', activeProfile?.id], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['myList'] }),
  });

  const myListIds = useMemo(() => myListItems.map(m => m.series_id), [myListItems]);

  const toggleList = useCallback(
    (seriesId) => {
      if (!activeProfile?.id) return;
      if (myListIds.includes(seriesId)) {
        removeFromListMut.mutate(seriesId);
      } else {
        addToListMut.mutate(seriesId);
      }
    },
    [activeProfile?.id, myListIds, removeFromListMut, addToListMut]
  );

  const visibleSeries = activeProfile?.is_kid
    ? allSeries.filter(s => s.age_rating === 'Livre' || s.category?.toLowerCase().includes('infantil'))
    : allSeries;

  const heroSlides = useMemo(() => {
    const seriesById = Object.fromEntries(visibleSeries.map((s) => [s.id, s]));
    const fromAdmin = [...featuredBannerRows]
      .sort((a, b) => a.order - b.order)
      .map((b) => {
        const sid = (b.series_id || '').trim();
        const series = sid ? seriesById[sid] : null;
        if (series) return seriesToHeroSlide(series, b.id);
        const hasCustom =
          (b.image && String(b.image).trim()) ||
          (b.title && String(b.title).trim()) ||
          (b.description && String(b.description).trim());
        if (hasCustom) return featuredBannerToHeroSlide(b);
        return null;
      })
      .filter(Boolean);
    if (fromAdmin.length > 0) return fromAdmin;
    return heroBanners.map(normalizeHeroSlide);
  }, [featuredBannerRows, visibleSeries, heroBanners]);

  return (
    <div className="relative min-h-screen bg-[#050508] text-white">
      <div className="home-browse-orbs" aria-hidden />
      <div className="relative z-[1]">
      <HeroBanner slides={heroSlides} />

      <div className="-mt-10 md:-mt-20 relative z-10">
        {homePageRowSequence.map((key, rowIndex) => {
          if (key === CONTINUE_WATCHING_HOME_KEY) {
            return (
              <ContinueWatching
                key={CONTINUE_WATCHING_HOME_KEY}
                history={history}
                episodes={episodes}
                allSeries={allSeries}
                profileName={activeProfile?.name}
              />
            );
          }
          const def = slugToNetflixRow[key];
          if (!def) return null;
          return (
            <NetflixHomeRow
              key={def.slug}
              slug={def.slug}
              label={def.label}
              rowIndex={rowIndex}
              visibleSeries={visibleSeries}
              myListIds={myListIds}
              onToggleList={toggleList}
              episodes={episodes}
            />
          );
        })}

        {seriesError && (
          <div className="flex flex-col items-center justify-center py-24 px-4 max-w-lg mx-auto text-center">
            <h2 className="text-xl font-bold mb-3 members-heading-gradient">Catálogo indisponível</h2>
            <p className="text-gray-300 text-sm mb-4">
              O site não conseguiu buscar filmes na API. Isto costuma ser:{' '}
              <strong className="text-white">DATABASE_URL</strong> em falta ou errada na Vercel, ou o deploy foi feito
              com <code className="text-gray-400">VITE_USE_REAL_API=false</code> (é preciso{' '}
              <strong className="text-white">true</strong> e um <strong className="text-white">novo deploy</strong>
              ).
            </p>
            <p className="text-xs text-red-300/90 break-words mb-4">
              {seriesQueryError?.message || 'Erro desconhecido'}
            </p>
            <p className="text-gray-500 text-xs">
              Testa no browser: <code className="text-gray-400">/api/health</code> e{' '}
              <code className="text-gray-400">/api/catalog/series?published=true</code>
            </p>
          </div>
        )}

        {!seriesLoading && !seriesError && allSeries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 px-4">
            <div className="text-6xl mb-6 drop-shadow-[0_0_24px_rgba(232,121,249,0.35)]">🎬</div>
            <h2 className="text-2xl font-bold mb-2 members-heading-gradient">Bem-vindo ao {brand.name}!</h2>
            <p className="text-gray-400 text-center max-w-md">
              {useRealApi
                ? 'Nenhum título publicado na base. Corre o seed na Neon (com a mesma DATABASE_URL da Vercel) ou adiciona conteúdo no painel admin.'
                : 'Nenhuma série disponível ainda. O administrador precisa adicionar conteúdo no painel admin.'}
            </p>
          </div>
        )}
      </div>

      <footer className="border-t border-neon-violet/15 mt-16 py-8 px-4 md:px-12 text-center text-xs text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} {footerContent.copyright}
        </p>
      </footer>
      </div>
    </div>
  );
}
