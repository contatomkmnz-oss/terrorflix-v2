import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Upload, RotateCcw, HardDrive, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildCatalogSnapshot,
  applyCatalogSnapshot,
  validateCatalogSnapshot,
  downloadCatalogBackupJson,
  clearAllCatalogKeys,
  getLastSavedDisplay,
  scheduleCatalogSync,
  CATALOG_BACKUP_SCHEMA_VERSION,
} from '@/lib/catalogPersistence';
import { mockTableKey } from '@/config/storageKeys';
import { mockTableCacheClearAll } from '@/api/mockTableReadCache';
import { useToast } from '@/components/ui/use-toast';

function getEpisodeCorruptBackupInfo() {
  if (typeof window === 'undefined') return { hasBackup: false, backupCount: 0, currentCount: 0 };
  const key = mockTableKey('Episode');
  const backupKey = `${key}_corrupt_backup`;
  let currentCount = 0;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) currentCount = p.length;
    }
  } catch {
    /* ignore */
  }
  let backupCount = 0;
  try {
    const rawB = localStorage.getItem(backupKey);
    if (rawB) {
      const p = JSON.parse(rawB);
      if (Array.isArray(p)) backupCount = p.length;
    }
  } catch {
    /* ignore */
  }
  return {
    hasBackup: backupCount > 0,
    backupCount,
    currentCount,
    backupKey,
  };
}

export default function AdminPersistence() {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [epRecoverInfo, setEpRecoverInfo] = useState(() => getEpisodeCorruptBackupInfo());

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [lastSaved, setLastSaved] = useState(() => getLastSavedDisplay());
  useEffect(() => {
    setLastSaved(getLastSavedDisplay());
  }, []);

  const onMergeEpisodesFromCorruptBackup = () => {
    const key = mockTableKey('Episode');
    const backupKey = `${key}_corrupt_backup`;
    const rawB = localStorage.getItem(backupKey);
    if (!rawB) {
      toast({
        title: 'Sem cópia de episódios',
        description: 'Não existe chave _corrupt_backup para Episode neste navegador.',
        variant: 'destructive',
      });
      return;
    }
    let backup;
    try {
      backup = JSON.parse(rawB);
    } catch {
      toast({ title: 'Cópia inválida', description: 'O JSON de segurança não pode ser lido.', variant: 'destructive' });
      return;
    }
    if (!Array.isArray(backup)) {
      toast({ title: 'Formato inesperado', description: 'Esperado um array de episódios.', variant: 'destructive' });
      return;
    }
    let current = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) current = p;
      }
    } catch {
      current = [];
    }
    const byId = Object.fromEntries(current.filter((e) => e?.id).map((e) => [e.id, e]));
    for (const e of backup) {
      if (e?.id && !byId[e.id]) byId[e.id] = e;
    }
    const merged = Object.values(byId);
    try {
      localStorage.setItem(key, JSON.stringify(merged));
      mockTableCacheClearAll();
      scheduleCatalogSync();
      setEpRecoverInfo(getEpisodeCorruptBackupInfo());
      toast({
        title: 'Episódios fundidos',
        description: `${merged.length} episódios no catálogo após juntar a cópia de segurança. A recarregar…`,
      });
      window.setTimeout(() => window.location.reload(), 400);
    } catch (e) {
      toast({
        title: 'Erro ao gravar',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    }
  };

  const onExport = () => {
    try {
      downloadCatalogBackupJson();
      toast({ title: 'Backup descarregado', description: 'Guarde o ficheiro JSON num local seguro.' });
    } catch (e) {
      toast({ title: 'Erro ao exportar', description: String(e.message || e), variant: 'destructive' });
    }
  };

  const onImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const data = JSON.parse(text);
        const v = validateCatalogSnapshot(data);
        if (!v.ok) {
          toast({ title: 'Backup inválido', description: v.error, variant: 'destructive' });
          setBusy(false);
          return;
        }
        applyCatalogSnapshot(data);
        toast({
          title: 'Backup importado',
          description: 'A recarregar para aplicar o catálogo completo…',
        });
        window.setTimeout(() => window.location.reload(), 400);
      } catch (err) {
        toast({ title: 'Erro ao ler JSON', description: String(err.message || err), variant: 'destructive' });
        setBusy(false);
      }
    };
    reader.onerror = () => {
      toast({ title: 'Falha na leitura do ficheiro', variant: 'destructive' });
      setBusy(false);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const onReset = () => {
    if (
      !window.confirm(
        'Isto apaga o catálogo e perfil guardados neste navegador (localStorage). ' +
          'Faça exportação de backup antes se precisar dos dados. Continuar?'
      )
    ) {
      return;
    }
    clearAllCatalogKeys();
    toast({ title: 'Armazenamento limpo', description: 'A recarregar…' });
    window.setTimeout(() => window.location.reload(), 300);
  };

  const snapPreview = () => {
    try {
      const s = buildCatalogSnapshot();
      return `${Object.keys(s.keys).length} chaves · schema v${s.schemaVersion}`;
    } catch {
      return '—';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/Admin" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Backup do catálogo</h1>
            <p className="text-gray-400 text-sm mt-1">Persistência local segura · BailaFit Dance demo</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#141414] p-5 space-y-3">
            <div className="flex items-start gap-3">
              <HardDrive className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Estado atual</p>
                <p className="text-sm text-gray-400 mt-1">
                  <span className="text-gray-300">Origem:</span>{' '}
                  <code className="text-xs bg-black/40 px-1.5 py-0.5 rounded">{origin}</code>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  <span className="text-gray-300">Último salvamento registado:</span>{' '}
                  {lastSaved ? new Date(lastSaved).toLocaleString('pt-BR') : '—'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  <span className="text-gray-300">Resumo:</span> {snapPreview()}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-100/95 leading-relaxed">
              Cada combinação de URL + porta tem o seu próprio armazenamento. Use sempre{' '}
              <strong className="text-amber-50">http://localhost:4173</strong> para desenvolvimento e preview
              (porta fixa no Vite). Modo anónimo ou limpar dados do site apaga o catálogo deste origem.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#141414] p-5 space-y-3">
            <p className="font-semibold text-white">Episódios que sumiram</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Uma regra antiga do modo local podia apagar episódios ao recarregar a página — isso já foi corrigido,
              mas <strong className="text-gray-200">não devolve automaticamente</strong> o que foi gravado em cima
              do armazenamento. Só volta o que estiver num <strong className="text-gray-200">ficheiro de backup JSON</strong>{' '}
              exportado antes (ou em <code className="text-xs bg-black/40 px-1">data/catalog-backup.json</code> de uma
              máquina onde ainda exista).
            </p>
            {epRecoverInfo.hasBackup ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <p className="text-sm text-gray-300">
                  Foi encontrada uma cópia automática de segurança do JSON de episódios ({epRecoverInfo.backupCount}{' '}
                  linhas). Pode tentar fundi-la com o catálogo actual ({epRecoverInfo.currentCount} episódios).
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-amber-500/50 text-amber-100 shrink-0"
                  disabled={busy}
                  onClick={onMergeEpisodesFromCorruptBackup}
                >
                  Fundir episódios da cópia de segurança
                </Button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Neste navegador não há <code className="bg-black/40 px-1">{mockTableKey('Episode')}_corrupt_backup</code>.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5 space-y-4">
            <p className="text-sm text-gray-300">
              Em <code className="text-xs bg-black/30 px-1">npm run dev</code>, o catálogo também é gravado
              automaticamente em <code className="text-xs bg-black/30 px-1">data/catalog-backup.json</code>{' '}
              (debounce após alterações). Pode copiar esse ficheiro para cópia de segurança fora do projeto.
            </p>
            <p className="text-xs text-gray-500">
              Versão do formato de backup: <strong>{CATALOG_BACKUP_SCHEMA_VERSION}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              type="button"
              onClick={onExport}
              className="bg-[#E50914] hover:bg-[#FF3D3D]"
              disabled={busy}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar backup (JSON)
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onImportFile}
            />
            <Button
              type="button"
              variant="outline"
              className="border-white/20"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar backup
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-red-900/80 hover:bg-red-800"
              disabled={busy}
              onClick={onReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar catálogo local
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
