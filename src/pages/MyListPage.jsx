import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Play, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyListPage() {
  const queryClient = useQueryClient();
  const activeProfile = JSON.parse(localStorage.getItem('desenhos_active_profile') || 'null');

  const { data: myListItems = [] } = useQuery({
    queryKey: ['myList', activeProfile?.id],
    queryFn: () => activeProfile?.id ? base44.entities.MyList.filter({ profile_id: activeProfile.id }) : [],
    enabled: !!activeProfile?.id,
  });

  const { data: allSeries = [] } = useQuery({
    queryKey: ['series'],
    queryFn: () => base44.entities.Series.list(),
  });

  const removeMut = useMutation({
    mutationFn: (itemId) => base44.entities.MyList.delete(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myList'] }),
  });

  const listSeries = useMemo(() => {
    return myListItems.map(item => {
      const s = allSeries.find(s => s.id === item.series_id);
      return s ? { ...s, listItemId: item.id } : null;
    }).filter(Boolean);
  }, [myListItems, allSeries]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Minha Lista</h1>

        {listSeries.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sua lista está vazia</h3>
            <p className="text-gray-400 mb-6">Adicione séries à sua lista para encontrá-las facilmente.</p>
            <Link to="/Browse" className="inline-flex items-center gap-2 bg-[#E50914] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#FF3D3D] transition-colors">
              Explorar Séries
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {listSeries.map(s => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative"
                >
                  <Link to={`/SeriesDetail?id=${s.id}`}>
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1A1A1A]">
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
                    <p className="mt-2 text-sm font-medium truncate text-gray-300 group-hover:text-white">{s.title}</p>
                  </Link>
                  <button
                    onClick={() => removeMut.mutate(s.listItemId)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}