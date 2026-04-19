import React, { useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { CONTENT_TYPE_MOVIE, hasPlayableVideoLink } from '@/constants/contentType';
import { catalogItemMatchesCategoryLabel } from '@/lib/categoryFilter';
import { getSlugToLabelMap } from '@/lib/homeRowOrderPreference';
import { rowMatchesItem } from '@/lib/netflixHomeRows';
import { imageUrlWithCacheBust } from '@/lib/imageCacheBust';
import { seriesDetailHref } from '@/lib/seriesRoutes';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const browseType = searchParams.get('type') || 'all';
  const sectionParam = searchParams.get('section');
  const categoryParam = searchParams.get('category');
  const activeCategory = categoryParam?.trim() ? categoryParam : 'Todas';

  const { data: allSeries = [], isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: () => base44.entities.Series.filter({ published: true }),
  });

  const { data: allEpisodes = [] } = useQuery({
    queryKey: ['episodes'],
    queryFn: () => base44.entities.Episode.list('-season', 500),
  });

  const byCatalogType = useMemo(() => {
    if (browseType === 'series') {
      return allSeries.filter((s) => s.content_type !== CONTENT_TYPE_MOVIE);
    }
    if (browseType === 'movie') {
      return allSeries.filter((s) => s.content_type === CONTENT_TYPE_MOVIE);
    }
    return allSeries;
  }, [allSeries, browseType]);

  const categories = useMemo(() => {
    const cats = new Set();
    byCatalogType.forEach((s) => {
      if (Array.isArray(s.categories)) {
        s.categories.forEach((c) => {
          const t = c.trim();
          if (t) cats.add(t);
        });
      }
      if (s.category) {
        s.category.split(',').forEach((c) => {
          const t = c.trim();
          if (t) cats.add(t);
        });
      }
    });
    return ['Todas', ...Array.from(cats).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [byCatalogType]);

  const filtered = useMemo(() => {
    let rows = byCatalogType;

    if (sectionParam) {
      const label = getSlugToLabelMap()[sectionParam];
      if (label) {
        rows = rows.filter((s) => rowMatchesItem(s, label));
      }
    }

    if (activeCategory === 'Todas') return rows;
    return rows.filter((s) => catalogItemMatchesCategoryLabel(s, activeCategory));
  }, [byCatalogType, activeCategory, sectionParam]);

  const setBrowseType = useCallback(
    (t) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (t === 'all') next.delete('type');
        else next.set('type', t === 'series' ? 'series' : 'movie');
        return next;
      });
    },
    [setSearchParams]
  );

  const setCategoryFilter = useCallback(
    (cat) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (cat === 'Todas') {
          next.delete('category');
        } else {
          next.set('category', cat);
          next.delete('section');
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const pageTitle =
    browseType === 'movie' ? 'Filmes' : browseType === 'series' ? 'Séries' : 'Catálogo';

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Filter className="w-4 h-4" />
            <span>{filtered.length} títulos</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-4">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'series', label: 'Séries' },
            { id: 'movie', label: 'Filmes' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setBrowseType(t.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                (browseType === 'all' && t.id === 'all') || browseType === t.id
                  ? 'bg-[#E50914] text-white'
                  : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-white/15 text-white ring-1 ring-white/30'
                  : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array(12)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-lg bg-[#1A1A1A] animate-pulse" />
              ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
          >
            {filtered.map((s) => {
              const canPlay = hasPlayableVideoLink(s, allEpisodes);
              return (
              <motion.div key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link to={seriesDetailHref(s)} className="group block">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1A1A1A] relative">
                    {s.cover_url ? (
                      <img
                        src={imageUrlWithCacheBust(s.cover_url, s)}
                        alt={s.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E50914]/20 to-[#1A1A1A] p-2">
                        <span className="text-xs font-bold text-center">{s.title}</span>
                      </div>
                    )}
                    {s.content_type === CONTENT_TYPE_MOVIE && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-black/70 text-white px-2 py-0.5 rounded">
                        Filme
                      </span>
                    )}
                    {canPlay && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                      </div>
                    </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate text-gray-300 group-hover:text-white">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.year}</p>
                  </div>
                </Link>
              </motion.div>
            );
            })}
          </motion.div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl font-semibold mb-2">Nenhum título encontrado</p>
            <p className="text-gray-400">Tente outro tipo ou categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
