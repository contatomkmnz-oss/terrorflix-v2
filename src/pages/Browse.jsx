import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Play, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Browse() {
  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get('category');
  const [activeCategory, setActiveCategory] = useState(urlCategory || 'Todas');

  const { data: allSeries = [], isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: () => base44.entities.Series.filter({ published: true }),
  });

  const categories = useMemo(() => {
    const cats = new Set();
    allSeries.forEach(s => {
      if (s.category) {
        s.category.split(',').forEach(c => cats.add(c.trim()));
      }
    });
    return ['Todas', ...Array.from(cats)];
  }, [allSeries]);

  const filtered = useMemo(() => {
    if (activeCategory === 'Todas') return allSeries;
    return allSeries.filter(s => s.category?.toLowerCase().includes(activeCategory.toLowerCase()));
  }, [allSeries, activeCategory]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Séries</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Filter className="w-4 h-4" />
            <span>{filtered.length} títulos</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-[#E50914] text-white'
                  : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-[#1A1A1A] animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
          >
            {filtered.map(s => (
              <motion.div key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link to={`/SeriesDetail?id=${s.id}`} className="group block">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1A1A1A] relative">
                    {s.cover_url ? (
                      <img src={s.cover_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E50914]/20 to-[#1A1A1A] p-2">
                        <span className="text-xs font-bold text-center">{s.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate text-gray-300 group-hover:text-white">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.year}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl font-semibold mb-2">Nenhuma série encontrada</p>
            <p className="text-gray-400">Tente selecionar outra categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
}