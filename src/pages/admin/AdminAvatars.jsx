import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ImageUpload from '@/components/admin/ImageUpload';

export default function AdminAvatars() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', image_url: '' });

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatars'],
    queryFn: () => base44.entities.Avatar.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Avatar.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['avatars'] }); setDialogOpen(false); setForm({ name: '', image_url: '' }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Avatar.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avatars'] }),
  });

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold flex-1">Avatares</h1>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#E50914] hover:bg-[#FF3D3D]">
            <Plus className="w-4 h-4 mr-2" /> Novo Avatar
          </Button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {avatars.map(av => (
            <div key={av.id} className="relative group flex flex-col items-center">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#1A1A1A]">
                <img src={av.image_url} alt={av.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate w-full text-center">{av.name}</p>
              <button
                onClick={() => { if (confirm('Excluir avatar?')) deleteMut.mutate(av.id); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {avatars.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p>Nenhum avatar cadastrado.</p>
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-sm">
            <DialogHeader><DialogTitle>Novo Avatar</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome (ex: Goku, Mickey...)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-[#2A2A2A] border-none" />
              <ImageUpload value={form.image_url} onChange={v => setForm({ ...form, image_url: v })} placeholder="Clique para enviar a imagem" aspectRatio="square" />
              <Button onClick={() => createMut.mutate(form)} disabled={!form.name.trim() || !form.image_url.trim()} className="w-full bg-[#E50914] hover:bg-[#FF3D3D]">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}