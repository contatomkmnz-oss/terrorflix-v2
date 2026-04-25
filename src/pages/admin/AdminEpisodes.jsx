import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminEpisodes() {
  const params = new URLSearchParams(window.location.search);
  const seriesId = params.get('seriesId');
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', season: 1, number: 1, description: '', video_url: '', duration: '', thumbnail_url: '' });

  const { data: series } = useQuery({
    queryKey: ['series', seriesId],
    queryFn: async () => { const l = await base44.entities.Series.filter({ id: seriesId }); return l[0]; },
    enabled: !!seriesId,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ['episodes', seriesId],
    queryFn: () => base44.entities.Episode.filter({ series_id: seriesId }),
    enabled: !!seriesId,
  });

  const sorted = [...episodes].sort((a, b) => {
    if ((a.season || 1) !== (b.season || 1)) return (a.season || 1) - (b.season || 1);
    return (a.number || 0) - (b.number || 0);
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Episode.create({ ...data, series_id: seriesId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['episodes'] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Episode.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['episodes'] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Episode.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['episodes'] }),
  });

  const openCreate = () => {
    setEditing(null);
    const nextNum = sorted.length > 0 ? (sorted[sorted.length - 1].number || 0) + 1 : 1;
    const lastSeason = sorted.length > 0 ? sorted[sorted.length - 1].season || 1 : 1;
    setForm({ title: '', season: lastSeason, number: nextNum, description: '', video_url: '', duration: '', thumbnail_url: '' });
    setDialogOpen(true);
  };

  const openEdit = (ep) => {
    setEditing(ep);
    setForm({
      title: ep.title || '', season: ep.season || 1, number: ep.number || 1,
      description: ep.description || '', video_url: ep.video_url || '',
      duration: ep.duration || '', thumbnail_url: ep.thumbnail_url || '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleSubmit = () => {
    const data = { ...form, season: Number(form.season), number: Number(form.number), duration: form.duration ? Number(form.duration) : undefined };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/AdminSeries" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Episódios</h1>
            {series && <p className="text-sm text-gray-400">{series.title}</p>}
          </div>
          <Button onClick={openCreate} className="bg-[#E50914] hover:bg-[#FF3D3D]">
            <Plus className="w-4 h-4 mr-2" /> Novo Episódio
          </Button>
        </div>

        <div className="space-y-2">
          {sorted.map(ep => (
            <div key={ep.id} className="flex items-center gap-4 p-3 bg-[#1A1A1A] rounded-lg hover:bg-[#222] transition-colors">
              <span className="text-gray-500 font-mono text-sm w-16 shrink-0">
                T{ep.season || 1}E{ep.number}
              </span>
              <div className="shrink-0 w-24 aspect-video rounded overflow-hidden bg-[#2A2A2A]">
                {(ep.thumbnail_url || series?.cover_url) ? (
                  <img src={ep.thumbnail_url || series?.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#2A2A2A]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{ep.title}</p>
                {ep.duration && <p className="text-xs text-gray-500">{Math.floor(ep.duration / 60)} min</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(ep)} className="p-2 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Excluir?')) deleteMut.mutate(ep.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {episodes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum episódio cadastrado.</p>
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Episódio' : 'Novo Episódio'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Título do Episódio" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-[#2A2A2A] border-none" />
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="Temporada" value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} className="bg-[#2A2A2A] border-none" />
                <Input type="number" placeholder="Número" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="bg-[#2A2A2A] border-none" />
                <Input type="number" placeholder="Duração (seg)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="bg-[#2A2A2A] border-none" />
              </div>
              <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-[#2A2A2A] border-none h-20" />
              <div className="space-y-1">
                <p className="text-xs text-gray-400">URL do Vídeo — cole URL do Google Drive ou Bunny</p>
                <Input placeholder="Ex: https://drive.google.com/... ou https://seu-cdn.b-cdn.net/.../playlist.m3u8" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} className="bg-[#2A2A2A] border-none" />
                {form.video_url && (form.video_url.includes('b-cdn.net') || form.video_url.includes('bunnycdn.com')) && (
                  <p className="text-xs text-blue-400">🎬 Detectado como Bunny — será reproduzido como vídeo nativo.</p>
                )}
                {form.video_url && form.video_url.includes('drive.google.com') && (
                  <p className="text-xs text-green-500">✓ Detectado como Google Drive.</p>
                )}
                {form.video_url && !form.video_url.includes('drive.google.com') && !form.video_url.includes('b-cdn.net') && !form.video_url.includes('bunnycdn.com') && (
                  <p className="text-xs text-yellow-500">⚡ Detectado como embed externo — será exibido via iframe no player.</p>
                )}
              </div>
              <Input placeholder="URL da Thumbnail" value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} className="bg-[#2A2A2A] border-none" />
              <Button onClick={handleSubmit} className="w-full bg-[#E50914] hover:bg-[#FF3D3D]">{editing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}