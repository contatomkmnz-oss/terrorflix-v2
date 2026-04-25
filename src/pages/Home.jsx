import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HeroBanner from '../components/home/HeroBanner';
import SeriesCarousel from '../components/home/SeriesCarousel';
import ContinueWatching from '../components/home/ContinueWatching';

export default function Home() {
  const queryClient = useQueryClient();
  const activeProfile = JSON.parse(localStorage.getItem('desenhos_active_profile') || 'null');

  const { data: allSeries = [] } = useQuery({
    queryKey: ['series'],
    queryFn: () => base44.entities.Series.filter({ published: true }),
  });

  const { data: bannerItems = [] } = useQuery({
    queryKey: ['featuredBanner'],
    queryFn: () => base44.entities.FeaturedBanner.filter({ active: true }, 'order', 5),
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

  const toggleList = (seriesId) => {
    if (!activeProfile?.id) return;
    if (myListIds.includes(seriesId)) {
      removeFromListMut.mutate(seriesId);
    } else {
      addToListMut.mutate(seriesId);
    }
  };

  // Kid profile filter
  const visibleSeries = activeProfile?.is_kid
    ? allSeries.filter(s => s.age_rating === 'Livre' || s.category?.toLowerCase().includes('infantil'))
    : allSeries;

  // Banner slideshow: usa FeaturedBanner se configurado, senão fallback para featured/primeiro
  const bannerSeries = useMemo(() => {
    if (bannerItems.length > 0) {
      return bannerItems
        .sort((a, b) => a.order - b.order)
        .map(item => visibleSeries.find(s => s.id === item.series_id))
        .filter(Boolean);
    }
    const fallback = visibleSeries.find(s => s.featured) || visibleSeries[0];
    return fallback ? [fallback] : [];
  }, [bannerItems, visibleSeries]);

  const byCategory = (cat) => visibleSeries.filter(s => s.category?.toLowerCase().includes(cat.toLowerCase()));

  const categories = useMemo(() => {
    const cats = new Set();
    visibleSeries.forEach(s => {
      if (s.category) {
        s.category.split(',').forEach(c => cats.add(c.trim()));
      }
    });
    return Array.from(cats);
  }, [allSeries]);

  const mostViewed = visibleSeries.filter(s => s.highlighted_home_section === 'mais_assistidos').length > 0
    ? visibleSeries.filter(s => s.highlighted_home_section === 'mais_assistidos')
    : [...visibleSeries].sort((a, b) => (b.total_views || 0) - (a.total_views || 0)).slice(0, 20);

  const mostViewedIds = new Set(mostViewed.map(s => s.id));

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <HeroBanner seriesList={bannerSeries} />

      <div className="-mt-10 md:-mt-20 relative z-10">
        {mostViewed.length > 0 && (
          <SeriesCarousel title="Mais Assistidos" series={mostViewed} myListIds={myListIds} onToggleList={toggleList} episodes={episodes} hideComingSoon={true} />
        )}

        <ContinueWatching history={history} episodes={episodes} allSeries={allSeries} profileName={activeProfile?.name} />

        {categories.map(cat => {
           const catSeries = byCategory(cat);
           if (catSeries.length === 0) return null;
           return (
             <SeriesCarousel
               key={cat}
               title={cat}
               series={catSeries}
               myListIds={myListIds}
               onToggleList={toggleList}
               category={cat}
               episodes={episodes}
               hideComingSoonIds={mostViewedIds}
             />
           );
         })}

        {allSeries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 px-4">
            <div className="text-6xl mb-6">🎬</div>
            <h2 className="text-2xl font-bold mb-2">Bem-vindo ao DesenhosFlix!</h2>
            <p className="text-gray-400 text-center max-w-md">
              Nenhuma série disponível ainda. O administrador precisa adicionar conteúdo no painel admin.
            </p>
          </div>
        )}
      </div>

      <footer className="border-t border-white/5 mt-16 py-8 px-4 md:px-12 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} DesenhosFlix. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}