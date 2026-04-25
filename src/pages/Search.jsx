import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, X, TrendingUp, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function Search() {
  const [query, setQuery] = useState('');

  const { data: allSeries = [] } = useQuery({
    queryKey: ['series'],
    queryFn: () => base44.entities.Series.filter({ published: true }),
  });

  const { data: popularTerms = [] } = useQuery({
    queryKey: ['searchTerms'],
    queryFn: () => base44.entities.SearchTerm.list('-frequency', 10),
  });

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allSeries.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }, [query, allSeries]);

  const logSearch = async () => {
    if (!query.trim()) return;
    const existing = popularTerms.find(t => t.term?.toLowerCase() === query.trim().toLowerCase());
    if (existing) {
      await base44.entities.SearchTerm.update(existing.id, { frequency: (existing.frequency || 0) + 1 });
    } else {
      await base44.entities.SearchTerm.create({ term: query.trim(), frequency: 1 });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar séries, animes, clássicos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && logSearch()}
            className="w-full pl-12 pr-12 py-4 text-lg bg-[#1A1A1A] border-none text-white rounded-lg focus:ring-2 focus:ring-[#E50914] placeholder:text-gray-500"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </button>
          )}
        </div>

        {!query && popularTerms.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Buscas Populares
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTerms.map(t => (
                <button
                  key={t.id}
                  onClick={() => setQuery(t.term)}
                  className="px-4 py-2 rounded-full bg-[#1A1A1A] text-sm text-gray-300 hover:bg-[#2A2A2A] hover:text-white transition-all"
                >
                  {t.term}
                </button>
              ))}
            </div>
          </div>
        )}

        {query && (
          <p className="text-sm text-gray-400 mb-6">
            {results.length} resultado{results.length !== 1 ? 's' : ''} para "{query}"
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={query}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
          >
            {results.map(s => (
              <Link key={s.id} to={`/SeriesDetail?id=${s.id}`} className="group">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1A1A1A] relative">
                  {s.cover_url ? (
                    <img src={s.cover_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E50914]/20 to-[#1A1A1A] p-2">
                      <span className="text-xs font-bold text-center">{s.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium truncate text-gray-300 group-hover:text-white transition-colors">{s.title}</p>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>

        {query && results.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-400">Tente buscar por outro título ou categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
}