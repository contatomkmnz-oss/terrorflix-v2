import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, LogOut, Check, Baby, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { brand } from '@/data/siteContent';
import { publicAssetUrl } from '@/lib/publicAssetUrl';
import { LS_ACTIVE_PROFILE } from '@/config/storageKeys';
import { scheduleCatalogSync } from '@/lib/catalogPersistence';
import { profileAvatars, preloadProfileAvatars } from '@/data/profileAvatars';
import ProfileAvatarImage from '@/components/profile/ProfileAvatarImage';

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

  useEffect(() => {
    preloadProfileAvatars();
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles', user?.email],
    queryFn: () => base44.entities.Profile.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  /** Lista fixa de avatares (fonte: src/data/profileAvatars.js) */
  const allAvatars = profileAvatars;

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
    localStorage.setItem(LS_ACTIVE_PROFILE, JSON.stringify(profile));
    scheduleCatalogSync();
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
      <div className="members-area flex flex-col items-center justify-center p-4">
        <div className="members-area-bg" aria-hidden />
        <div className="members-area-inner w-full max-w-lg">
          <button onClick={() => { setMode(editingProfile ? 'manage' : 'select'); resetForm(); }} className="text-gray-400 hover:text-white mb-6 text-sm flex items-center gap-1">
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold mb-6 members-heading-gradient">{editingProfile ? 'Editar Perfil' : 'Criar Perfil'}</h2>

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
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-xl mx-auto">
                {allAvatars.map((av) => {
                  const selected = form.avatar_url === av.image_url;
                  return (
                    <button
                      type="button"
                      key={av.id || av.name}
                      onClick={() => setForm({ ...form, avatar_url: av.image_url })}
                      className={`group relative aspect-square w-full max-w-[88px] sm:max-w-none mx-auto rounded-lg overflow-hidden ring-2 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-member-bg ${
                        selected
                          ? 'ring-neon-cyan scale-105 z-10 members-neon-ring'
                          : 'ring-transparent hover:ring-neon-fuchsia/50 hover:scale-105'
                      }`}
                    >
                      <ProfileAvatarImage
                        src={av.image_url}
                        alt={av.name}
                        className="h-full w-full object-cover"
                        loading="eager"
                      />
                      {selected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                          <Check className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 members-neon-card rounded-lg">
              <Baby className="w-5 h-5 text-neon-lime drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <div className="flex-1">
                <p className="text-sm font-medium">Perfil Infantil</p>
                <p className="text-xs text-gray-400">Exibe apenas conteúdo para crianças (Livre)</p>
              </div>
              <Switch checked={form.is_kid} onCheckedChange={v => setForm({ ...form, is_kid: v })} />
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || createMut.isPending || updateMut.isPending}
              className="w-full py-3 text-base font-semibold bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan text-white border-0 hover:opacity-95 shadow-[0_0_24px_-6px_rgba(232,121,249,0.5)]"
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
      <div className="members-area flex flex-col items-center justify-center p-4">
        <div className="members-area-bg" aria-hidden />
        <div className="members-area-inner w-full max-w-lg">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setMode('select')} className="text-gray-400 hover:text-white text-sm">← Voltar</button>
            <h2 className="text-2xl font-bold members-heading-gradient">Gerenciar Perfis</h2>
            <div />
          </div>

          <div className="space-y-3 mb-6">
            {profiles.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 rounded-lg members-neon-card border border-transparent hover:border-neon-cyan/25 transition-colors"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#333] ring-1 ring-white/10">
                  {p.avatar_url ? (
                    <ProfileAvatarImage src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-black text-white bg-gradient-to-br from-neon-fuchsia to-neon-cyan">
                      {p.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  {p.is_kid && (
                    <span className="text-[10px] text-neon-lime flex items-center gap-1 mt-0.5">
                      <Baby className="w-3 h-3" />
                      Infantil
                    </span>
                  )}
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
            <Button
              onClick={openCreate}
              variant="outline"
              className="w-full border-dashed border-neon-violet/40 text-gray-300 hover:text-white hover:border-neon-cyan/60 hover:bg-neon-cyan/5"
            >
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
              <div className="members-neon-card rounded-xl p-6 max-w-sm w-full">
                <h3 className="font-bold text-lg mb-2">Excluir perfil?</h3>
                <p className="text-gray-400 text-sm mb-6">O perfil <strong>"{deleteConfirm.name}"</strong> e todo seu histórico serão removidos.</p>
                <div className="flex gap-3">
                  <Button onClick={() => deleteMut.mutate(deleteConfirm.id)} className="bg-red-600 hover:bg-red-700 flex-1">
                    Excluir
                  </Button>
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
    <div className="members-area flex flex-col items-center justify-center p-4">
      <div className="members-area-bg" aria-hidden />
      <div className="members-area-inner flex flex-col items-center w-full">
      <div className="mb-12 text-center">
        <img
          src={publicAssetUrl(brand.logoUrl)}
          alt={brand.name}
          className="h-12 w-auto mx-auto mb-8 object-contain drop-shadow-[0_0_20px_rgba(232,121,249,0.35)]"
        />
        <h1 className="text-3xl md:text-4xl font-semibold members-heading-gradient">Quem está assistindo?</h1>
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
            <div className="relative w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-lg overflow-hidden ring-2 ring-transparent transition-all duration-200 group-hover:ring-neon-cyan group-hover:scale-105 group-hover:shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)]">
              {p.avatar_url ? (
                <ProfileAvatarImage
                  src={p.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white bg-gradient-to-br from-neon-fuchsia via-neon-magenta to-neon-cyan">
                  {p.name[0]}
                </div>
              )}
            </div>
            <span className="mt-3 text-sm text-gray-500 group-hover:text-neon-cyan transition-colors font-medium">{p.name}</span>
            {p.is_kid && (
              <span className="text-[10px] text-neon-lime flex items-center gap-1 mt-0.5">
                <Baby className="w-3 h-3" />
                Infantil
              </span>
            )}
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
            <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded bg-member-surface/80 border border-neon-violet/20 group-hover:border-neon-cyan/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_0_20px_-6px_rgba(34,211,238,0.35)]">
              <div className="w-12 h-12 rounded-full border-2 border-neon-violet/50 group-hover:border-neon-cyan flex items-center justify-center transition-colors">
                <Plus className="w-7 h-7 text-neon-violet group-hover:text-neon-cyan transition-colors" />
              </div>
            </div>
            <span className="mt-3 text-sm text-gray-500 group-hover:text-neon-cyan transition-colors font-medium">Adicionar perfil</span>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={() => setMode('manage')}
          className="text-sm text-gray-500 hover:text-white border border-neon-violet/35 hover:border-neon-cyan/60 hover:bg-neon-cyan/5 px-8 py-2 rounded-lg transition-all tracking-widest uppercase text-xs"
        >
          Gerenciar perfis
        </button>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-neon-cyan transition-colors"
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
            <div className="members-neon-card rounded-xl p-6 max-w-sm w-full border-red-500/30">
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
                    localStorage.removeItem(LS_ACTIVE_PROFILE);
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
    </div>
  );
}