import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, RefreshCw, ArrowUp, ArrowDown, Eye, EyeOff, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import ImageUpload from '@/components/admin/ImageUpload';
import { toast } from 'sonner';

const emptyCustomForm = () => ({
  title: '',
  image: '',
  description: '',
  custom_url: '',
  detail_url: '',
  banner_object_position: 'center center',
  hero_year: '',
  hero_rating: '',
  hero_category: '',
});

export default function AdminBanner() {
  const queryClient = useQueryClient();
  /** Ordem do novo slot; `addingFlow` indica se vem do catálogo ou banner livre */
  const [addingSlot, setAddingSlot] = useState(null);
  const [addingFlow, setAddingFlow] = useState(null); // null | 'series' | 'custom'
  const [customForm, setCustomForm] = useState(emptyCustomForm);
  const [editBanner, setEditBanner] = useState(null);

  const { data: banners = [], isLoading: loadingBanners } = useQuery({
    queryKey: ['featuredBanner'],
    queryFn: () => base44.entities.FeaturedBanner.list('order', 10),
  });

  const { data: allSeries = [] } = useQuery({
    queryKey: ['series'],
    queryFn: () => base44.entities.Series.filter({ published: true }),
  });

  const resetAddFlow = () => {
    setAddingSlot(null);
    setAddingFlow(null);
    setCustomForm(emptyCustomForm());
  };

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.FeaturedBanner.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredBanner'] });
      resetAddFlow();
    },
    onError: (err) => {
      toast.error(err?.message || 'Não foi possível criar o banner.');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeaturedBanner.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredBanner'] });
      setEditBanner(null);
    },
    onError: (err) => {
      toast.error(err?.message || 'Não foi possível atualizar.');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.FeaturedBanner.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['featuredBanner'] }),
  });

  const sortedBanners = [...banners].sort((a, b) => a.order - b.order);
  const maxOrder = sortedBanners.length > 0 ? Math.max(...sortedBanners.map((b) => b.order)) : 0;
  const canAdd = true;

  const seriesById = Object.fromEntries(allSeries.map((s) => [s.id, s]));

  const swapOrder = (indexA, indexB) => {
    const a = sortedBanners[indexA];
    const b = sortedBanners[indexB];
    if (!a || !b) return;
    updateMut.mutate({ id: a.id, data: { order: b.order } });
    updateMut.mutate({ id: b.id, data: { order: a.order } });
  };

  const resolveRow = (banner) => {
    const sid = (banner.series_id || '').trim();
    const series = sid ? seriesById[sid] : null;
    const isCustom = !series;
    const thumb = series?.cover_url || banner.image || '';
    const title = series?.title || banner.title || (isCustom ? 'Banner livre' : 'Título não encontrado');
    const sub = series?.category || banner.hero_category || (isCustom ? 'Sem ligação ao catálogo' : '');
    return { series, isCustom, thumb, title, sub };
  };

  const submitCustomCreate = () => {
    const title = customForm.title.trim();
    const image = customForm.image.trim();
    if (!title || !image) {
      toast.error('Título e imagem do banner são obrigatórios.');
      return;
    }
    createMut.mutate({
      series_id: '',
      title,
      image,
      description: customForm.description.trim(),
      custom_url: customForm.custom_url.trim(),
      detail_url: customForm.detail_url.trim(),
      banner_object_position: customForm.banner_object_position.trim() || 'center center',
      hero_year: customForm.hero_year.trim(),
      hero_rating: customForm.hero_rating.trim(),
      hero_category: customForm.hero_category.trim(),
      order: addingSlot,
      active: true,
    });
  };

  const openEditCustom = (banner) => {
    setEditBanner({
      ...banner,
      _form: {
        title: banner.title || '',
        image: banner.image || '',
        description: banner.description || '',
        custom_url: banner.custom_url || '',
        detail_url: banner.detail_url || '',
        banner_object_position: banner.banner_object_position || 'center center',
        hero_year: banner.hero_year || '',
        hero_rating: banner.hero_rating || '',
        hero_category: banner.hero_category || '',
      },
    });
  };

  const saveEditCustom = () => {
    if (!editBanner?._form) return;
    const f = editBanner._form;
    const title = f.title.trim();
    const image = f.image.trim();
    if (!title || !image) {
      toast.error('Título e imagem são obrigatórios.');
      return;
    }
    updateMut.mutate({
      id: editBanner.id,
      data: {
        series_id: '',
        title,
        image,
        description: f.description.trim(),
        custom_url: f.custom_url.trim(),
        detail_url: f.detail_url.trim(),
        banner_object_position: f.banner_object_position.trim() || 'center center',
        hero_year: f.hero_year.trim(),
        hero_rating: f.hero_rating.trim(),
        hero_category: f.hero_category.trim(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Banner Principal (Destaques)</h1>
            <p className="text-gray-400 text-sm mt-1">
              Os itens ativos aparecem no <strong className="text-white">carrossel do topo da home</strong>. Pode ligar a
              uma série ou filme do catálogo ou criar um <strong className="text-white">banner livre</strong> só com
              imagem e texto. Se não houver banners ativos, a home usa{' '}
              <code className="text-gray-300">src/data/heroBanners.js</code>.
            </p>
          </div>
          <Link to="/Admin">
            <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
              ← Voltar
            </Button>
          </Link>
        </div>

        {loadingBanners ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-[#E50914]" />
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBanners.map((banner, index) => {
              const row = resolveRow(banner);
              return (
                <div
                  key={banner.id}
                  className="flex items-center gap-4 bg-[#1A1A1A] rounded-xl p-4 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-[#E50914]/20 text-[#E50914] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {banner.order}
                  </div>

                  {row.thumb ? (
                    <img
                      src={row.thumb}
                      alt=""
                      className="w-12 h-16 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-white/5 rounded-md flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{row.title}</p>
                    <p className="text-gray-500 text-xs truncate">{row.sub}</p>
                  </div>

                  {row.isCustom && (
                    <button
                      type="button"
                      onClick={() => openEditCustom(banner)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Editar banner livre"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => updateMut.mutate({ id: banner.id, data: { active: !banner.active } })}
                    className={`p-2 rounded-lg transition-colors ${banner.active ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-600 hover:bg-white/10'}`}
                    title={banner.active ? 'Ativo' : 'Inativo'}
                  >
                    {banner.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => swapOrder(index, index - 1)}
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sortedBanners.length - 1}
                      onClick={() => swapOrder(index, index + 1)}
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteMut.mutate(banner.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {canAdd &&
              (addingSlot === null ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingSlot(maxOrder + 1);
                      setAddingFlow('series');
                    }}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Do catálogo (série/filme)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingSlot(maxOrder + 1);
                      setAddingFlow('custom');
                    }}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-violet-500/40 text-violet-200 hover:text-white hover:border-violet-400/60 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Banner livre (só imagem)
                  </button>
                </div>
              ) : addingFlow === 'series' ? (
                <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#E50914]/30">
                  <p className="text-gray-400 text-sm mb-3">
                    Escolha um título publicado para o slot <strong className="text-white">{addingSlot}</strong>:
                  </p>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <div className="flex-1">
                      <Select
                        onValueChange={(seriesId) => {
                          createMut.mutate({ series_id: seriesId, order: addingSlot, active: true });
                        }}
                      >
                        <SelectTrigger className="bg-[#2A2A2A] border-white/10 text-white">
                          <SelectValue placeholder="Selecione uma série ou filme…" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2A2A2A] border-white/10">
                          {allSeries
                            .filter((s) => !banners.some((b) => b.series_id === s.id))
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id} className="text-white hover:bg-white/10">
                                {s.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      onClick={resetAddFlow}
                      className="border-white/10 text-gray-400"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1A1A1A] rounded-xl p-4 border border-violet-500/30 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-gray-400 text-sm">
                      Banner livre — slot <strong className="text-white">{addingSlot}</strong>. O botão «Assistir» só
                      aparece se preencher a URL de ação.
                    </p>
                    <Button variant="outline" onClick={resetAddFlow} className="border-white/10 text-gray-400 shrink-0">
                      Cancelar
                    </Button>
                  </div>
                  <ImageUpload
                    value={customForm.image}
                    onChange={(url) => setCustomForm((f) => ({ ...f, image: url }))}
                    placeholder="Imagem do banner (obrigatório)"
                  />
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Título (hero)</label>
                    <Input
                      value={customForm.title}
                      onChange={(e) => setCustomForm((f) => ({ ...f, title: e.target.value }))}
                      className="bg-[#2A2A2A] border-white/10 text-white"
                      placeholder="Ex.: Aulas ao vivo esta semana"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
                    <Textarea
                      value={customForm.description}
                      onChange={(e) => setCustomForm((f) => ({ ...f, description: e.target.value }))}
                      className="bg-[#2A2A2A] border-white/10 text-white min-h-[80px]"
                      placeholder="Texto abaixo do título no banner"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">URL «Assistir» (opcional)</label>
                      <Input
                        value={customForm.custom_url}
                        onChange={(e) => setCustomForm((f) => ({ ...f, custom_url: e.target.value }))}
                        className="bg-[#2A2A2A] border-white/10 text-white"
                        placeholder="/Browse ou https://…"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">URL «Mais informações» (opcional)</label>
                      <Input
                        value={customForm.detail_url}
                        onChange={(e) => setCustomForm((f) => ({ ...f, detail_url: e.target.value }))}
                        className="bg-[#2A2A2A] border-white/10 text-white"
                        placeholder="/Subscription ou https://…"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Ano (opcional)</label>
                      <Input
                        value={customForm.hero_year}
                        onChange={(e) => setCustomForm((f) => ({ ...f, hero_year: e.target.value }))}
                        className="bg-[#2A2A2A] border-white/10 text-white"
                        placeholder="2026"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Classificação</label>
                      <Input
                        value={customForm.hero_rating}
                        onChange={(e) => setCustomForm((f) => ({ ...f, hero_rating: e.target.value }))}
                        className="bg-[#2A2A2A] border-white/10 text-white"
                        placeholder="Livre"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Etiqueta / categoria</label>
                      <Input
                        value={customForm.hero_category}
                        onChange={(e) => setCustomForm((f) => ({ ...f, hero_category: e.target.value }))}
                        className="bg-[#2A2A2A] border-white/10 text-white"
                        placeholder="Evento, Promo…"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Posição da imagem (object-position)</label>
                    <Input
                      value={customForm.banner_object_position}
                      onChange={(e) => setCustomForm((f) => ({ ...f, banner_object_position: e.target.value }))}
                      className="bg-[#2A2A2A] border-white/10 text-white"
                      placeholder="center center"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={submitCustomCreate}
                    disabled={createMut.isPending}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    {createMut.isPending ? 'A guardar…' : 'Criar banner livre'}
                  </Button>
                </div>
              ))}

            {sortedBanners.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhum banner configurado ainda.</p>
            )}
          </div>
        )}

        <Dialog open={!!editBanner} onOpenChange={(open) => !open && setEditBanner(null)}>
          <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar banner livre</DialogTitle>
            </DialogHeader>
            {editBanner?._form && (
              <div className="space-y-3 py-2">
                <ImageUpload
                  value={editBanner._form.image}
                  onChange={(url) =>
                    setEditBanner((b) => (b ? { ...b, _form: { ...b._form, image: url } } : null))
                  }
                />
                <Input
                  value={editBanner._form.title}
                  onChange={(e) =>
                    setEditBanner((b) => (b ? { ...b, _form: { ...b._form, title: e.target.value } } : null))
                  }
                  className="bg-[#2A2A2A] border-white/10"
                  placeholder="Título"
                />
                <Textarea
                  value={editBanner._form.description}
                  onChange={(e) =>
                    setEditBanner((b) => (b ? { ...b, _form: { ...b._form, description: e.target.value } } : null))
                  }
                  className="bg-[#2A2A2A] border-white/10 min-h-[72px]"
                  placeholder="Descrição"
                />
                <Input
                  value={editBanner._form.custom_url}
                  onChange={(e) =>
                    setEditBanner((b) => (b ? { ...b, _form: { ...b._form, custom_url: e.target.value } } : null))
                  }
                  className="bg-[#2A2A2A] border-white/10"
                  placeholder="URL Assistir"
                />
                <Input
                  value={editBanner._form.detail_url}
                  onChange={(e) =>
                    setEditBanner((b) => (b ? { ...b, _form: { ...b._form, detail_url: e.target.value } } : null))
                  }
                  className="bg-[#2A2A2A] border-white/10"
                  placeholder="URL Mais informações"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={editBanner._form.hero_year}
                    onChange={(e) =>
                      setEditBanner((b) => (b ? { ...b, _form: { ...b._form, hero_year: e.target.value } } : null))
                    }
                    className="bg-[#2A2A2A] border-white/10"
                    placeholder="Ano"
                  />
                  <Input
                    value={editBanner._form.hero_rating}
                    onChange={(e) =>
                      setEditBanner((b) => (b ? { ...b, _form: { ...b._form, hero_rating: e.target.value } } : null))
                    }
                    className="bg-[#2A2A2A] border-white/10"
                    placeholder="Classif."
                  />
                  <Input
                    value={editBanner._form.hero_category}
                    onChange={(e) =>
                      setEditBanner((b) => (b ? { ...b, _form: { ...b._form, hero_category: e.target.value } } : null))
                    }
                    className="bg-[#2A2A2A] border-white/10"
                    placeholder="Categoria"
                  />
                </div>
                <Input
                  value={editBanner._form.banner_object_position}
                  onChange={(e) =>
                    setEditBanner((b) =>
                      b ? { ...b, _form: { ...b._form, banner_object_position: e.target.value } } : null
                    )
                  }
                  className="bg-[#2A2A2A] border-white/10"
                  placeholder="object-position"
                />
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="border-white/10 text-gray-300" onClick={() => setEditBanner(null)}>
                Fechar
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-500" onClick={saveEditCustom} disabled={updateMut.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
