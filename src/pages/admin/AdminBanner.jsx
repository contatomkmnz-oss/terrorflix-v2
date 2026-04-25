import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, RefreshCw, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

export default function AdminBanner() {
  const queryClient = useQueryClient();
  const [addingSlot, setAddingSlot] = useState(null); // order number being added

  const { data: banners = [], isLoading: loadingBanners } = useQuery({
    queryKey: ['featuredBanners'],
    queryFn: () => base44.entities.FeaturedBanner.list('order', 10),
  });

  const { data: allSeries = [] } = useQuery({
    queryKey: ['seriesAll'],
    queryFn: () => base44.entities.Series.filter({ published: true }),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.FeaturedBanner.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredBanners'] });
      setAddingSlot(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeaturedBanner.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['featuredBanners'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.FeaturedBanner.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['featuredBanners'] }),
  });

  const sortedBanners = [...banners].sort((a, b) => a.order - b.order);
  const usedOrders = new Set(sortedBanners.map(b => b.order));
  const maxOrder = sortedBanners.length > 0 ? Math.max(...sortedBanners.map(b => b.order)) : 0;
  const canAdd = sortedBanners.length < 5;

  const seriesById = Object.fromEntries(allSeries.map(s => [s.id, s]));

  const swapOrder = (indexA, indexB) => {
    const a = sortedBanners[indexA];
    const b = sortedBanners[indexB];
    if (!a || !b) return;
    updateMut.mutate({ id: a.id, data: { order: b.order } });
    updateMut.mutate({ id: b.id, data: { order: a.order } });
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Banner Principal</h1>
            <p className="text-gray-400 text-sm mt-1">Configure até 5 séries no carrossel da página inicial</p>
          </div>
          <Link to="/Admin">
            <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">← Voltar</Button>
          </Link>
        </div>

        {loadingBanners ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-[#E50914]" />
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBanners.map((banner, index) => {
              const series = seriesById[banner.series_id];
              return (
                <div
                  key={banner.id}
                  className="flex items-center gap-4 bg-[#1A1A1A] rounded-xl p-4 border border-white/5"
                >
                  {/* Order number */}
                  <div className="w-8 h-8 rounded-full bg-[#E50914]/20 text-[#E50914] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {banner.order}
                  </div>

                  {/* Thumbnail */}
                  {series?.cover_url ? (
                    <img src={series.cover_url} alt={series.title} className="w-12 h-16 object-cover rounded-md flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-16 bg-white/5 rounded-md flex-shrink-0" />
                  )}

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{series?.title || 'Série não encontrada'}</p>
                    <p className="text-gray-500 text-xs truncate">{series?.category || ''}</p>
                  </div>

                  {/* Toggle active */}
                  <button
                    onClick={() => updateMut.mutate({ id: banner.id, data: { active: !banner.active } })}
                    className={`p-2 rounded-lg transition-colors ${banner.active ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-600 hover:bg-white/10'}`}
                    title={banner.active ? 'Ativo' : 'Inativo'}
                  >
                    {banner.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Move up/down */}
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={index === 0}
                      onClick={() => swapOrder(index, index - 1)}
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === sortedBanners.length - 1}
                      onClick={() => swapOrder(index, index + 1)}
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteMut.mutate(banner.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Add new slot */}
            {canAdd && (
              addingSlot === null ? (
                <button
                  onClick={() => setAddingSlot(maxOrder + 1)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar série ao banner ({sortedBanners.length}/5)
                </button>
              ) : (
                <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#E50914]/30">
                  <p className="text-gray-400 text-sm mb-3">Escolha uma série para o slot {addingSlot}:</p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Select
                        onValueChange={(seriesId) => {
                          createMut.mutate({ series_id: seriesId, order: addingSlot, active: true });
                        }}
                      >
                        <SelectTrigger className="bg-[#2A2A2A] border-white/10 text-white">
                          <SelectValue placeholder="Selecione uma série..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2A2A2A] border-white/10">
                          {allSeries
                            .filter(s => !banners.some(b => b.series_id === s.id))
                            .map(s => (
                              <SelectItem key={s.id} value={s.id} className="text-white hover:bg-white/10">
                                {s.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setAddingSlot(null)}
                      className="border-white/10 text-gray-400"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )
            )}

            {sortedBanners.length === 0 && !canAdd === false && (
              <p className="text-center text-gray-500 py-8">Nenhuma série no banner ainda.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}