import {
  NETFLIX_HOME_ROW_ORDER,
  CONTINUE_WATCHING_HOME_KEY,
} from '@/data/netflixRowOrder';
import { CONTENT_TYPE_MOVIE } from '@/constants/contentType';
import {
  LS_HOME_NETFLIX_ROW_SLUG_ORDER,
  LS_HOME_CUSTOM_CATEGORY_ROWS,
} from '@/config/storageKeys';
import { scheduleCatalogSync } from '@/lib/catalogPersistence';

const DEFAULT_SLUGS = NETFLIX_HOME_ROW_ORDER.map((r) => r.slug);
const DEFAULT_SLUG_SET = new Set(DEFAULT_SLUGS);

const EVENT = 'bailafit-home-row-order-changed';

export function subscribeHomeRowOrder(cb) {
  if (typeof window === 'undefined') return () => {};
  const onEvt = () => cb();
  window.addEventListener(EVENT, onEvt);
  return () => window.removeEventListener(EVENT, onEvt);
}

function notifyHomeRowOrderChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

function slugifyLabel(input) {
  return (
    String(input || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'categoria'
  );
}

export function loadCustomHomeCategoryRows() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_HOME_CUSTOM_CATEGORY_ROWS);
    if (!raw) return [];
    const p = JSON.parse(raw);
    if (!Array.isArray(p)) return [];
    return p
      .filter((x) => x && typeof x.slug === 'string' && typeof x.label === 'string')
      .map((x) => ({ slug: x.slug.trim(), label: x.label.trim() }))
      .filter((x) => x.slug && x.label);
  } catch {
    return [];
  }
}

function saveCustomHomeCategoryRows(rows) {
  localStorage.setItem(LS_HOME_CUSTOM_CATEGORY_ROWS, JSON.stringify(rows));
  scheduleCatalogSync();
}

function getAllSlugsSet() {
  const custom = loadCustomHomeCategoryRows();
  return new Set([...DEFAULT_SLUGS, ...custom.map((c) => c.slug)]);
}

function getMergedBySlug() {
  const bySlug = Object.fromEntries(NETFLIX_HOME_ROW_ORDER.map((r) => [r.slug, r]));
  for (const row of loadCustomHomeCategoryRows()) {
    bySlug[row.slug] = { slug: row.slug, label: row.label };
  }
  return bySlug;
}

/** Lista completa de slugs: cinco padrão + categorias personalizadas (ordem base). */
export function getFullCanonicalSlugOrder() {
  return [...DEFAULT_SLUGS, ...loadCustomHomeCategoryRows().map((r) => r.slug)];
}

function mergeOrderWithSaved(savedRaw, fullList) {
  const fullSet = new Set(fullList);
  const out = [];
  const seen = new Set();
  if (Array.isArray(savedRaw)) {
    for (const s of savedRaw) {
      if (typeof s === 'string' && fullSet.has(s) && !seen.has(s)) {
        out.push(s);
        seen.add(s);
      }
    }
  }
  for (const s of fullList) {
    if (!seen.has(s)) out.push(s);
  }
  return out;
}

function loadSavedSlugOrderArray() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_HOME_NETFLIX_ROW_SLUG_ORDER);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : null;
  } catch {
    return null;
  }
}

function persistMergedOrder() {
  const full = getFullCanonicalSlugOrder();
  const saved = loadSavedSlugOrderArray();
  const next = mergeOrderWithSaved(saved, full);
  localStorage.setItem(LS_HOME_NETFLIX_ROW_SLUG_ORDER, JSON.stringify(next));
  scheduleCatalogSync();
  notifyHomeRowOrderChanged();
}

/** Ordem efectiva na UI: `{ slug, label }[]`. */
export function getEffectiveNetflixHomeRowOrder() {
  const bySlug = getMergedBySlug();
  const full = getFullCanonicalSlugOrder();
  const saved = loadSavedSlugOrderArray();
  const slugs = mergeOrderWithSaved(saved, full);
  return slugs.map((s) => bySlug[s]).filter(Boolean);
}

export function getEffectiveHomePageRowSequence() {
  return [CONTINUE_WATCHING_HOME_KEY, ...getEffectiveNetflixHomeRowOrder().map((r) => r.slug)];
}

export function getSlugToLabelMap() {
  const m = {};
  for (const r of getEffectiveNetflixHomeRowOrder()) {
    m[r.slug] = r.label;
  }
  return m;
}

export function getLabelToSlugMap() {
  const m = {};
  for (const r of getEffectiveNetflixHomeRowOrder()) {
    m[r.label] = r.slug;
  }
  return m;
}

export function getHomeSectionSlugSet() {
  return getAllSlugsSet();
}

export function getHomeSectionLabelsLowerSet() {
  const set = new Set(NETFLIX_HOME_ROW_ORDER.map((r) => r.label.trim().toLowerCase()));
  for (const row of loadCustomHomeCategoryRows()) {
    set.add(row.label.trim().toLowerCase());
  }
  return set;
}

export function isHomeCatalogSlug(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s !== '' && getHomeSectionSlugSet().has(s);
}

export function seriesQualifiesForHomeCatalogEpisodes(s) {
  if (!s) return false;
  if (s.content_type === CONTENT_TYPE_MOVIE) {
    const cats = Array.isArray(s.categories) ? s.categories : [];
    const labelSet = getHomeSectionLabelsLowerSet();
    return cats.some((c) => labelSet.has(String(c).trim().toLowerCase()));
  }
  return isHomeCatalogSlug(s.highlighted_home_section);
}

/**
 * Adiciona uma fileira na home com este rótulo (filmes: mesma linha em «Categorias Netflix»; séries: escolhe slug no admin).
 * Ignora se o nome coincidir com uma fileira padrão ou já existir.
 */
export function addCustomHomeCategory(rawLabel) {
  const label = String(rawLabel || '').trim();
  if (!label) return false;
  if (NETFLIX_HOME_ROW_ORDER.some((r) => r.label.trim().toLowerCase() === label.toLowerCase())) {
    return false;
  }
  const rows = loadCustomHomeCategoryRows();
  if (rows.some((r) => r.label.toLowerCase() === label.toLowerCase())) return false;
  const existingSlugs = new Set([...DEFAULT_SLUGS, ...rows.map((r) => r.slug)]);
  const base = `cat-${slugifyLabel(label)}`;
  let slug = base;
  let n = 0;
  while (existingSlugs.has(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  rows.push({ slug, label });
  saveCustomHomeCategoryRows(rows);
  try {
    persistMergedOrder();
    return true;
  } catch {
    return false;
  }
}

export function removeCustomHomeCategoryByLabel(rawLabel) {
  const needle = String(rawLabel || '').trim().toLowerCase();
  if (!needle) return false;
  const prev = loadCustomHomeCategoryRows();
  const rows = prev.filter((r) => r.label.toLowerCase() !== needle);
  if (rows.length === prev.length) return false;
  saveCustomHomeCategoryRows(rows);
  try {
    persistMergedOrder();
    return true;
  } catch {
    return false;
  }
}

export function presetHasHomeRowLabel(label) {
  const n = String(label || '').trim().toLowerCase();
  if (!n) return false;
  return loadCustomHomeCategoryRows().some((r) => r.label.toLowerCase() === n);
}

/**
 * @param {string[]} slugs Permutação exacta de `getFullCanonicalSlugOrder()`.
 */
export function saveHomeNetflixRowSlugOrder(slugs) {
  const full = getFullCanonicalSlugOrder();
  if (!Array.isArray(slugs) || slugs.length !== full.length) return false;
  const setFull = new Set(full);
  if (slugs.some((s) => typeof s !== 'string' || !setFull.has(s))) return false;
  if (new Set(slugs).size !== full.length) return false;
  try {
    localStorage.setItem(LS_HOME_NETFLIX_ROW_SLUG_ORDER, JSON.stringify(slugs));
    scheduleCatalogSync();
    notifyHomeRowOrderChanged();
    return true;
  } catch {
    return false;
  }
}

export function clearHomeNetflixRowSlugOrder() {
  try {
    localStorage.removeItem(LS_HOME_NETFLIX_ROW_SLUG_ORDER);
    scheduleCatalogSync();
    notifyHomeRowOrderChanged();
  } catch {
    /* ignore */
  }
}
