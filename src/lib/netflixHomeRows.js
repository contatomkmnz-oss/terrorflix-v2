import { isMovie } from '@/constants/contentType';
import { getLabelToSlugMap } from '@/lib/homeRowOrderPreference';
import { normalizeHighlightSection } from '@/lib/maisAssistidos';
import { catalogItemMatchesCategoryLabel } from '@/lib/categoryFilter';

export function uniqueById(items) {
  const seen = new Set();
  return items.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

function movieHasCategory(s, label) {
  if (!isMovie(s) || !Array.isArray(s.categories)) return false;
  const q = label.trim().toLowerCase();
  return s.categories.some((c) => c.trim().toLowerCase() === q);
}

/**
 * Filmes: só `categories[]`.
 * Séries: `highlighted_home_section` (slug = rótulo) OU tokens em `category` / `categories`.
 */
export function rowMatchesItem(s, rowLabel) {
  const label = rowLabel.trim();
  if (!label) return false;

  if (isMovie(s)) {
    return movieHasCategory(s, label);
  }

  const slug = getLabelToSlugMap()[label];
  if (slug && normalizeHighlightSection(s.highlighted_home_section) === slug) {
    return true;
  }
  return catalogItemMatchesCategoryLabel(s, label);
}

export function getItemsForNetflixRow(visibleSeries, rowLabel) {
  const matched = visibleSeries.filter((x) => rowMatchesItem(x, rowLabel));
  return [...matched].sort((a, b) => (b.total_views || 0) - (a.total_views || 0));
}
