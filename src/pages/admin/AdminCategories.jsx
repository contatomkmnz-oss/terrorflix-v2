import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Tags, Plus, Trash2, ChevronUp, ChevronDown, RotateCcw, Rows3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LS_ADMIN_CATEGORY_PRESETS } from '@/config/storageKeys';
import { scheduleCatalogSync } from '@/lib/catalogPersistence';
import {
  getEffectiveNetflixHomeRowOrder,
  saveHomeNetflixRowSlugOrder,
  clearHomeNetflixRowSlugOrder,
  subscribeHomeRowOrder,
  addCustomHomeCategory,
  removeCustomHomeCategoryByLabel,
  presetHasHomeRowLabel,
} from '@/lib/homeRowOrderPreference';
import { toast } from 'sonner';

function collectLabelsFromSeries(s) {
  const out = new Set();
  if (Array.isArray(s.categories)) {
    s.categories.forEach((c) => {
      const t = String(c || '').trim();
      if (t) out.add(t);
    });
  }
  if (s.category) {
    String(s.category)
      .split(',')
      .forEach((c) => {
        const t = c.trim();
        if (t) out.add(t);
      });
  }
  return out;
}

function loadPresets() {
  try {
    const raw = localStorage.getItem(LS_ADMIN_CATEGORY_PRESETS);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map((x) => String(x).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function savePresets(list) {
  const unique = [...new Set(list.map((x) => String(x).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
  localStorage.setItem(LS_ADMIN_CATEGORY_PRESETS, JSON.stringify(unique));
  scheduleCatalogSync();
  return unique;
}

export default function AdminCategories() {
  const { data: series = [] } = useQuery({
    queryKey: ['adminSeries'],
    queryFn: () => base44.entities.Series.list('-created_date'),
  });

  const [homeRowTick, setHomeRowTick] = useState(0);
  useEffect(() => subscribeHomeRowOrder(() => setHomeRowTick((t) => t + 1)), []);

  const [presets, setPresets] = useState(() => loadPresets());
  const [newLabel, setNewLabel] = useState('');

  const homeRowsOrdered = useMemo(() => getEffectiveNetflixHomeRowOrder(), [homeRowTick]);

  const inUse = useMemo(() => {
    const acc = new Set();
    series.forEach((s) => {
      collectLabelsFromSeries(s).forEach((c) => acc.add(c));
    });
    return [...acc].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [series]);

  const moveHomeRow = useCallback((index, delta) => {
    const rows = getEffectiveNetflixHomeRowOrder();
    const j = index + delta;
    if (j < 0 || j >= rows.length) return;
    const slugs = rows.map((r) => r.slug);
    const t = slugs[index];
    slugs[index] = slugs[j];
    slugs[j] = t;
    if (saveHomeNetflixRowSlugOrder(slugs)) toast.success('Ordem da home atualizada.');
    else toast.error('Não foi possível guardar a ordem.');
  }, []);

  const resetHomeRowOrder = useCallback(() => {
    clearHomeNetflixRowSlugOrder();
    toast.success('Ordem reposta para o padrão do site.');
  }, []);

  const addPreset = useCallback(() => {
    const t = newLabel.trim();
    if (!t) {
      toast.error('Escreve o nome da categoria.');
      return;
    }
    if (presets.includes(t)) {
      toast.message('Esta categoria já está na lista de presets.');
      setNewLabel('');
      return;
    }
    const next = savePresets([...presets, t]);
    setPresets(next);
    setNewLabel('');
    toast.success('Categoria guardada nos presets.');
  }, [newLabel, presets]);

  const removePreset = useCallback((label) => {
    removeCustomHomeCategoryByLabel(label);
    const next = savePresets(presets.filter((p) => p !== label));
    setPresets(next);
    toast.success('Removido dos presets.');
  }, [presets]);

  const togglePresetOnHome = useCallback((label) => {
    if (presetHasHomeRowLabel(label)) {
      removeCustomHomeCategoryByLabel(label);
      toast.success('Fileira removida da home.');
    } else if (addCustomHomeCategory(label)) {
      toast.success(`«${label}» na home. Filmes: inclui este nome nas categorias.`);
    } else {
      toast.error('Nome inválido, duplicado ou igual a uma fileira padrão.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Tags className="w-7 h-7 text-[#E50914]" />
            <div>
              <h1 className="text-2xl font-bold">Categorias</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Fileiras da home, categorias em uso e presets para copiar ao editar filmes.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl bg-[#1A1A1A] p-5 border border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Ordem das categorias na home
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetHomeRowOrder}
                className="border-white/20 text-gray-300 hover:text-white shrink-0"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Repor ordem padrão
              </Button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Define a ordem das fileiras abaixo do hero (após «Continuar a ver»), incluindo categorias
              personalizadas. Os rótulos não mudam — só a ordem na página inicial.
            </p>
            <ul className="space-y-2">
              {homeRowsOrdered.map((row, index) => (
                <li
                  key={row.slug}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#141414] border border-white/10"
                >
                  <span className="text-sm text-gray-200 flex-1 min-w-0">
                    <span className="text-gray-500 mr-2">{index + 1}.</span>
                    {row.label}
                    {row.slug.startsWith('cat-') && (
                      <span className="block text-[10px] text-gray-500 font-mono mt-0.5">
                        Séries: secção «{row.slug}»
                      </span>
                    )}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveHomeRow(index, -1)}
                      className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
                      aria-label={`Mover «${row.label}» para cima`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === homeRowsOrdered.length - 1}
                      onClick={() => moveHomeRow(index, 1)}
                      className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
                      aria-label={`Mover «${row.label}» para baixo`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-[#1A1A1A] p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Nomes das fileiras (Netflix)
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Para <strong className="text-gray-400">filmes</strong>, o texto tem de coincidir exactamente com
              o rótulo da fileira (incluindo categorias que activaste com o ícone de fileiras nos presets). Em{' '}
              <strong className="text-gray-400">séries</strong>, escolhe o slug correspondente em «Secção
              especial».
            </p>
            <ul className="flex flex-wrap gap-2">
              {homeRowsOrdered.map((r) => (
                <li
                  key={r.slug}
                  className="px-3 py-1.5 rounded-lg bg-[#141414] text-sm text-gray-200 border border-white/10"
                >
                  {r.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-[#1A1A1A] p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Categorias em uso no catálogo
            </h2>
            {inUse.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma categoria encontrada nos títulos.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {inUse.map((label) => (
                  <li
                    key={label}
                    className="px-3 py-1.5 rounded-lg bg-[#141414] text-sm text-gray-200 border border-white/10"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl bg-[#1A1A1A] p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Adicionar categoria (presets)
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Guarda rótulos que usas com frequência. Clica no ícone de fileiras para essa categoria passar a
              aparecer como linha na home; usa o <strong className="text-gray-400">mesmo nome</strong> nas
              categorias do filme (ou o slug na série).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input
                placeholder="Ex.: Treinos principais"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPreset())}
                className="bg-[#141414] border-white/10 flex-1"
              />
              <Button
                type="button"
                onClick={addPreset}
                className="bg-[#E50914] hover:bg-[#FF3D3D] shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Guardar preset
              </Button>
            </div>
            {presets.length === 0 ? (
              <p className="text-sm text-gray-500">Ainda não há presets.</p>
            ) : (
              <ul className="space-y-2">
                {presets.map((label) => (
                  <li
                    key={label}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#141414] border border-white/10"
                  >
                    <span className="text-sm text-gray-200 flex-1 min-w-0">{label}</span>
                    <div className="flex items-center shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => togglePresetOnHome(label)}
                        className={`p-2 rounded-md transition-colors ${
                          presetHasHomeRowLabel(label)
                            ? 'text-[#E50914] bg-[#E50914]/15'
                            : 'text-gray-500 hover:text-white hover:bg-white/10'
                        }`}
                        title="Mostrar como fileira na home"
                        aria-label={
                          presetHasHomeRowLabel(label)
                            ? `Remover «${label}» da home`
                            : `Adicionar «${label}» à home`
                        }
                      >
                        <Rows3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePreset(label)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        aria-label={`Remover ${label}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex justify-end">
            <Link
              to="/AdminSeries"
              className="text-sm font-medium text-[#E50914] hover:text-[#FF3D3D]"
            >
              Ir para Séries e filmes →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
