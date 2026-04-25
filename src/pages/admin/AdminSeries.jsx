import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, Eye, EyeOff, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/admin/ImageUpload';

export default function AdminSeries() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', year: '', cover_url: '', banner_url: '', published: true, featured: false, age_rating: 'Livre', highlighted_home_section: null });

  const { data: series = [], isLoading } = useQuery({
    queryKey: ['adminSeries'],
    queryFn: () => base44.entities.Series.list('-created_date'),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Series.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminSeries'] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Series.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminSeries'] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Series.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminSeries'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', category: '', year: '', cover_url: '', banner_url: '', published: true, featured: false, age_rating: 'Livre', highlighted_home_section: null });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title || '', description: s.description || '', category: s.category || '',
      year: s.year || '', cover_url: s.cover_url || '', banner_url: s.banner_url || '',
      published: s.published !== false, featured: s.featured || false, age_rating: s.age_rating || 'Livre',
      highlighted_home_section: s.highlighted_home_section || null,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleSubmit = () => {
    const data = { ...form, year: form.year ? Number(form.year) : undefined };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold flex-1">Séries</h1>
          <Button onClick={openCreate} className="bg-[#E50914] hover:bg-[#FF3D3D]">
            <Plus className="w-4 h-4 mr-2" /> Nova Série
          </Button>
        </div>

        <div className="space-y-3">
          {series.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg hover:bg-[#222] transition-colors">
              <div className="shrink-0 w-16 h-24 rounded overflow-hidden bg-[#2A2A2A]">
                {s.cover_url ? (
                  <img src={s.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">{s.title?.[0]}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{s.title}</h3>
                  {s.featured && <Star className="w-4 h-4 text-[#FFC107] fill-current shrink-0" />}
                  {!s.published && <EyeOff className="w-4 h-4 text-gray-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">{s.category} • {s.year} • {s.age_rating}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/AdminEpisodes?seriesId=${s.id}`} className="text-xs text-[#E50914] hover:text-[#FF3D3D] px-3 py-1 border border-[#E50914] rounded">
                  Episódios
                </Link>
                <button onClick={() => openEdit(s)} className="p-2 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Excluir série?')) deleteMut.mutate(s.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {series.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma série cadastrada.</p>
              <Button onClick={openCreate} className="mt-4 bg-[#E50914] hover:bg-[#FF3D3D]">Criar primeira série</Button>
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Série' : 'Nova Série'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-[#2A2A2A] border-none" />
              <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-[#2A2A2A] border-none h-24" />
              <Input placeholder="Categorias (ex: Anime, Ação)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-[#2A2A2A] border-none" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Ano" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="bg-[#2A2A2A] border-none" />
                <Select value={form.age_rating} onValueChange={v => setForm({ ...form, age_rating: v })}>
                  <SelectTrigger className="bg-[#2A2A2A] border-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Livre', '10+', '12+', '14+', '16+', '18+'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Capa da Série</p>
                <ImageUpload value={form.cover_url} onChange={v => setForm({ ...form, cover_url: v })} placeholder="Clique para enviar a capa" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Banner</p>
                <ImageUpload value={form.banner_url} onChange={v => setForm({ ...form, banner_url: v })} placeholder="Clique para enviar o banner" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.published} onCheckedChange={v => setForm({ ...form, published: v })} /> Publicada</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={v => setForm({ ...form, featured: v })} /> Destaque</label>
              </div>
              <Select value={form.highlighted_home_section || ''} onValueChange={v => setForm({ ...form, highlighted_home_section: v || null })}>
                <SelectTrigger className="bg-[#2A2A2A] border-none"><SelectValue placeholder="Nenhuma seção especial" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhuma seção especial</SelectItem>
                  <SelectItem value="mais_assistidos">Mais Assistidos</SelectItem>
                  <SelectItem value="destaques">Destaques</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSubmit} className="w-full bg-[#E50914] hover:bg-[#FF3D3D]">{editing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}