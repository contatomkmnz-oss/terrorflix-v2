import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isLikelyBunnyUrl } from '@/config/bunny';
import { publicAssetUrl } from '@/lib/publicAssetUrl';
import { isMovie } from '@/constants/contentType';
import {
  formatMediaDurationSeconds,
  isDirectVideoUrlForProbe,
  probeVideoDurationSeconds,
} from '@/lib/formatMediaDuration';
import { useToast } from '@/components/ui/use-toast';

export default function AdminEpisodes() {
  const params = new URLSearchParams(window.location.search);
  const seriesId = params.get('seriesId');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [probingDuration, setProbingDuration] = useState(false);
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
    const isFilme = series && isMovie(series);
    const nextNum = sorted.length > 0 ? (sorted[sorted.length - 1].number || 0) + 1 : 1;
    const lastSeason = sorted.length > 0 ? sorted[sorted.length - 1].season || 1 : 1;
    setForm({
      title: '',
      season: isFilme ? 1 : lastSeason,
      number: isFilme ? 1 : nextNum,
      description: '',
      video_url: '',
      duration: '',
      thumbnail_url: '',
    });
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

  const isFilme = series && isMovie(series);

  const detectDurationFromVideoFile = async () => {
    const url = String(form.video_url || '').trim();
    if (!url) return;
    setProbingDuration(true);
    try {
      const sec = await probeVideoDurationSeconds(url);
      setForm((f) => ({ ...f, duration: String(sec) }));
      toast({
        title: 'Duração do vídeo',
        description: `${formatMediaDurationSeconds(sec)} (${sec}s) — guardada no formulário.`,
      });
    } catch (e) {
      toast({
        title: 'Não foi possível detectar',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    } finally {
      setProbingDuration(false);
    }
  };

  const videoUrlBlock = (
    <div className="space-y-2 rounded-lg border border-[#E50914]/30 bg-[#E50914]/5 p-4">
      <p className="text-sm font-semibold text-white">
        {isFilme ? 'URL do vídeo do filme' : 'URL do vídeo'}
        <span className="text-[#E50914] font-normal"> *</span>
      </p>
      <p className="text-xs text-gray-400 leading-relaxed">
        Cole o link público: Bunny (iframe ou CDN), Google Drive ou .mp4/.webm. Em <strong className="text-gray-300">filmes</strong> podes
        definir só aqui (URL do episódio) ou só em Séries e Filmes (URL do filme) — qualquer um serve.
      </p>
      <Input
        placeholder="Qualquer URL de vídeo (https://…) — Bunny, YouTube, Vimeo, .mp4, .m3u8, embed, etc."
        value={form.video_url}
        onChange={(e) => setForm({ ...form, video_url: e.target.value })}
        className="bg-[#2A2A2A] border border-white/10 text-white"
      />
      {form.video_url && isLikelyBunnyUrl(form.video_url) && !form.video_url.toLowerCase().includes('mediadelivery') && (
        <p className="text-xs text-blue-400">Bunny CDN — reprodução em &lt;video&gt; (MP4/WebM; HLS pode variar por browser).</p>
      )}
      {form.video_url && form.video_url.toLowerCase().includes('mediadelivery') && (
        <p className="text-xs text-blue-400">Bunny Stream — player em iframe (recomendado).</p>
      )}
      {form.video_url && form.video_url.includes('drive.google.com') && (
        <p className="text-xs text-green-500">Google Drive (preview em iframe).</p>
      )}
      {form.video_url &&
        !isLikelyBunnyUrl(form.video_url) &&
        !form.video_url.includes('drive.google.com') &&
        /\.(mp4|webm)(\?|$)/i.test(form.video_url) && (
          <p className="text-xs text-gray-400">Ficheiro direto — &lt;video&gt; nativo.</p>
        )}
      {form.video_url && isDirectVideoUrlForProbe(form.video_url) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={probingDuration}
          onClick={detectDurationFromVideoFile}
          className="border-white/20 text-gray-200 hover:bg-white/10"
        >
          <Timer className="w-4 h-4 mr-2" />
          {probingDuration ? 'A ler o vídeo…' : 'Detectar duração do ficheiro'}
        </Button>
      )}
      {form.video_url && !isDirectVideoUrlForProbe(form.video_url) && (
        <p className="text-xs text-gray-500">
          Para Bunny Stream, YouTube ou links embed, defina a duração em segundos à mão (ou use um ficheiro .mp4/.webm
          público para detectar).
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/AdminSeries" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{isFilme ? 'Filme' : 'Episódios'}</h1>
            {series && (
              <p className="text-sm text-gray-400 flex flex-wrap items-center gap-2 mt-1">
                <span>{series.title}</span>
                {isFilme && (
                  <span className="text-[10px] font-bold uppercase bg-[#E50914]/20 text-[#E50914] px-2 py-0.5 rounded">
                    Adicione a URL do vídeo abaixo
                  </span>
                )}
              </p>
            )}
          </div>
          <Button onClick={openCreate} className="bg-[#E50914] hover:bg-[#FF3D3D]">
            <Plus className="w-4 h-4 mr-2" /> {isFilme ? 'Adicionar o Filme' : 'Novo Episódio'}
          </Button>
        </div>

        <div className="space-y-2">
          {sorted.map((ep) => {
            const durationLabel = formatMediaDurationSeconds(ep.duration);
            return (
            <div key={ep.id} className="flex items-center gap-4 p-3 bg-[#1A1A1A] rounded-lg hover:bg-[#222] transition-colors">
              <span className="text-gray-500 font-mono text-sm w-16 shrink-0">
                T{ep.season || 1}E{ep.number}
              </span>
              <div className="shrink-0 w-24 aspect-video rounded overflow-hidden bg-[#2A2A2A]">
                {(ep.thumbnail_url || series?.cover_url) ? (
                  <img src={publicAssetUrl(ep.thumbnail_url || series?.cover_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#2A2A2A]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{ep.title}</p>
                {durationLabel && (
                  <p className="text-xs text-gray-500 tabular-nums">{durationLabel}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(ep)} className="p-2 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Excluir?')) deleteMut.mutate(ep.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            );
          })}
          {episodes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>{isFilme ? 'Nenhum vídeo do filme cadastrado. Use “Adicionar o Filme” e cole a URL.' : 'Nenhum episódio cadastrado.'}</p>
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isFilme
                  ? editing
                    ? 'Editar vídeo do filme'
                    : 'Adicionar o Filme'
                  : editing
                    ? 'Editar Episódio'
                    : 'Novo Episódio'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {isFilme ? (
                <>
                  {videoUrlBlock}
                  <Input
                    placeholder="Título (opcional, ex.: Versão estendida)"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-[#2A2A2A] border-none"
                  />
                  <div className="space-y-1">
                    <Input
                      type="number"
                      placeholder="Duração em segundos (opcional)"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="bg-[#2A2A2A] border-none"
                    />
                    {formatMediaDurationSeconds(form.duration) && (
                      <p className="text-xs text-gray-500 tabular-nums">
                        Pré-visualização: {formatMediaDurationSeconds(form.duration)}
                      </p>
                    )}
                  </div>
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-[#2A2A2A] border-none h-20"
                  />
                  <Input
                    placeholder="URL da thumbnail (opcional)"
                    value={form.thumbnail_url}
                    onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    className="bg-[#2A2A2A] border-none"
                  />
                </>
              ) : (
                <>
                  <Input
                    placeholder="Título do Episódio"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-[#2A2A2A] border-none"
                  />
                  {videoUrlBlock}
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      placeholder="Temporada"
                      value={form.season}
                      onChange={(e) => setForm({ ...form, season: e.target.value })}
                      className="bg-[#2A2A2A] border-none"
                    />
                    <Input
                      type="number"
                      placeholder="Número"
                      value={form.number}
                      onChange={(e) => setForm({ ...form, number: e.target.value })}
                      className="bg-[#2A2A2A] border-none"
                    />
                    <div className="flex flex-col gap-1">
                      <Input
                        type="number"
                        placeholder="Duração (seg)"
                        value={form.duration}
                        onChange={(e) => setForm({ ...form, duration: e.target.value })}
                        className="bg-[#2A2A2A] border-none"
                      />
                      {formatMediaDurationSeconds(form.duration) && (
                        <span className="text-[10px] text-gray-500 tabular-nums text-center">
                          {formatMediaDurationSeconds(form.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Textarea
                    placeholder="Descrição"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-[#2A2A2A] border-none h-20"
                  />
                  <Input
                    placeholder="URL da Thumbnail"
                    value={form.thumbnail_url}
                    onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    className="bg-[#2A2A2A] border-none"
                  />
                </>
              )}
              <Button onClick={handleSubmit} className="w-full bg-[#E50914] hover:bg-[#FF3D3D]">
                {editing ? 'Salvar Alterações' : isFilme ? 'Guardar filme' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}