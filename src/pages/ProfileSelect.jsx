import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, LogOut, Check, Baby, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileSelect() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('select'); // 'select' | 'manage' | 'create' | 'edit'
  const isAdmin = user?.role === 'admin';
  const maxProfiles = isAdmin ? 5 : 3;
  const [editingProfile, setEditingProfile] = useState(null);
  const [form, setForm] = useState({ name: '', is_kid: false, avatar_url: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles', user?.email],
    queryFn: () => base44.entities.Profile.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatars'],
    queryFn: () => base44.entities.Avatar.list(),
  });

  const defaultAvatars = [
    { id: 'default-1', name: 'Goku', image_url: 'https://i.imgur.com/3TqSCGl.png' },
    { id: 'default-2', name: 'Mickey', image_url: 'https://i.imgur.com/bpnGfXe.png' },
    { id: 'default-3', name: 'Tom', image_url: 'https://i.imgur.com/vL5LXJM.png' },
    { id: 'default-4', name: 'Scooby', image_url: 'https://i.imgur.com/k1WT2VH.png' },
  ];
  const allAvatars = avatars.length > 0 ? avatars : defaultAvatars;

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Profile.create(data),
    onSuccess: (createdProfile) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      resetForm();
      // Se é o primeiro perfil, seleciona automaticamente e vai para Home
      if (profiles.length === 0) {
        selectProfile(createdProfile);
      } else {
        setMode('select');
      }
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Profile.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profiles'] }); setMode('manage'); setEditingProfile(null); resetForm(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Profile.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profiles'] }); setDeleteConfirm(null); },
  });

  const resetForm = () => setForm({ name: '', is_kid: false, avatar_url: '' });

  const selectProfile = (profile) => {
    localStorage.setItem('desenhos_active_profile', JSON.stringify(profile));
    navigate('/Home');
  };

  const openCreate = () => { resetForm(); setEditingProfile(null); setMode('create'); };

  const openEdit = (p) => {
    setEditingProfile(p);
    setForm({ name: p.name, is_kid: p.is_kid || false, avatar_url: p.avatar_url || '' });
    setMode('edit');
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingProfile) {
      updateMut.mutate({ id: editingProfile.id, data: { ...form, user_email: user.email } });
    } else {
      createMut.mutate({ ...form, user_email: user.email });
    }
  };

  // FORM (create/edit)
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <button onClick={() => { setMode(editingProfile ? 'manage' : 'select'); resetForm(); }} className="text-gray-400 hover:text-white mb-6 text-sm flex items-center gap-1">
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold mb-6">{editingProfile ? 'Editar Perfil' : 'Criar Perfil'}</h2>

          <div className="space-y-5">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nome do Perfil *</label>
              <Input
                placeholder="Ex: João, Mamãe, Bebê..."
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="bg-[#2A2A2A] border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Escolha um Avatar</label>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {allAvatars.map(av => (
                  <button
                    key={av.id || av.name}
                    onClick={() => setForm({ ...form, avatar_url: av.image_url })}
                    className={`relative aspect-square rounded overflow-hidden ring-2 transition-all ${form.avatar_url === av.image_url ? 'ring-white scale-105' : 'ring-transparent hover:ring-white/50'}`}
                  >
                    <img src={av.image_url} alt={av.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                    <div className="w-full h-full bg-gradient-to-br from-[#E50914]/30 to-[#1A1A1A] flex items-center justify-center text-xs font-bold absolute inset-0 -z-10">
                      {av.name?.[0]}
                    </div>
                    {form.avatar_url === av.image_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#1A1A1A] rounded-lg">
              <Baby className="w-5 h-5 text-[#FFC107]" />
              <div className="flex-1">
                <p className="text-sm font-medium">Perfil Infantil</p>
                <p className="text-xs text-gray-400">Exibe apenas conteúdo para crianças (Livre)</p>
              </div>
              <Switch checked={form.is_kid} onCheckedChange={v => setForm({ ...form, is_kid: v })} />
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || createMut.isPending || updateMut.isPending}
              className="w-full bg-[#E50914] hover:bg-[#C11119] py-3 text-base font-semibold"
            >
              {createMut.isPending || updateMut.isPending ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // MANAGE
  if (mode === 'manage') {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setMode('select')} className="text-gray-400 hover:text-white text-sm">← Voltar</button>
            <h2 className="text-2xl font-bold">Gerenciar Perfis</h2>
            <div />
          </div>

          <div className="space-y-3 mb-6">
            {profiles.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-[#2A2A2A] rounded border border-white/5 hover:border-white/20 transition-colors">
                <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-[#333]">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-black text-white bg-[#E50914]">{p.name[0]}</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  {p.is_kid && <span className="text-[10px] text-[#FFC107] flex items-center gap-1 mt-0.5"><Baby className="w-3 h-3" />Infantil</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-white rounded transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(p)}
                    disabled={profiles.length <= 1}
                    className="p-2 text-gray-400 hover:text-red-400 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {profiles.length < maxProfiles && (
            <Button onClick={openCreate} variant="outline" className="w-full border-dashed border-gray-600 text-gray-300 hover:text-white hover:border-white">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Perfil
            </Button>
          )}
          {!isAdmin && profiles.length >= maxProfiles && (
            <p className="text-center text-xs text-gray-500 mt-2">Limite de 3 perfis atingido</p>
          )}
        </div>

        <AnimatePresence>
          {deleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-[#2A2A2A] rounded p-6 max-w-sm w-full border border-white/10">
                <h3 className="font-bold text-lg mb-2">Excluir perfil?</h3>
                <p className="text-gray-400 text-sm mb-6">O perfil <strong>"{deleteConfirm.name}"</strong> e todo seu histórico serão removidos.</p>
                <div className="flex gap-3">
                  <Button onClick={() => deleteMut.mutate(deleteConfirm.id)} className="bg-[#E50914] hover:bg-[#C11119] flex-1">Excluir</Button>
                  <Button onClick={() => setDeleteConfirm(null)} variant="outline" className="border-gray-600 text-gray-300 flex-1">Cancelar</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // SELECT (main) — Netflix style
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
      <div className="mb-12 text-center">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b61a29474f4e54b5af9b86/acb41898f_desenhosflix.png"
          alt="DesenhosFlix"
          className="h-12 w-auto mx-auto mb-8 object-contain"
        />
        <h1 className="text-3xl md:text-4xl font-semibold text-white">Quem está assistindo?</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-5 mb-12 max-w-3xl">
        {profiles.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => selectProfile(p)}
          >
            <div className="relative w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded overflow-hidden transition-all duration-200 group-hover:ring-2 group-hover:ring-white group-hover:scale-105">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white bg-[#E50914]">
                  {p.name[0]}
                </div>
              )}
            </div>
            <span className="mt-3 text-sm text-[#808080] group-hover:text-white transition-colors font-medium">{p.name}</span>
            {p.is_kid && <span className="text-[10px] text-[#FFC107] flex items-center gap-1 mt-0.5"><Baby className="w-3 h-3" />Infantil</span>}
          </motion.div>
        ))}

        {profiles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Crie seu primeiro perfil para começar.</p>
          </div>
        )}

        {profiles.length < maxProfiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center cursor-pointer group"
            onClick={openCreate}
          >
            <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded bg-[#2A2A2A] group-hover:bg-[#3A3A3A] flex items-center justify-center transition-all duration-200 group-hover:scale-105">
              <div className="w-12 h-12 rounded-full border-2 border-[#808080] group-hover:border-white flex items-center justify-center transition-colors">
                <Plus className="w-7 h-7 text-[#808080] group-hover:text-white transition-colors" />
              </div>
            </div>
            <span className="mt-3 text-sm text-[#808080] group-hover:text-white transition-colors font-medium">Adicionar perfil</span>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={() => setMode('manage')}
          className="text-sm text-[#808080] hover:text-white border border-[#808080] hover:border-white px-8 py-2 rounded transition-all tracking-widest uppercase text-xs"
        >
          Gerenciar perfis
        </button>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-2 text-sm text-[#808080] hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>

      <button
        onClick={() => setDeleteAccountConfirm(true)}
        className="mt-8 flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors"
      >
        <UserX className="w-3.5 h-3.5" /> Excluir minha conta
      </button>

      {/* Modal deletar conta */}
      <AnimatePresence>
        {deleteAccountConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-sm w-full border border-red-500/30">
              <UserX className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="font-bold text-xl text-center mb-2">Excluir conta?</h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                Esta ação é <strong className="text-red-400">irreversível</strong>. Todos os seus perfis, histórico e assinatura serão permanentemente apagados.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    setDeletingAccount(true);
                    await base44.functions.invoke('deleteMyAccount', {});
                    localStorage.removeItem('desenhos_active_profile');
                    base44.auth.logout();
                  }}
                  disabled={deletingAccount}
                  className="bg-red-600 hover:bg-red-700 flex-1"
                >
                  {deletingAccount ? 'Excluindo...' : 'Sim, excluir tudo'}
                </Button>
                <Button onClick={() => setDeleteAccountConfirm(false)} variant="outline" className="border-gray-600 text-gray-300 flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}