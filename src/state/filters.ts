import { CATEGORIES, type Category } from '@/data/schema';

import { loadJson, saveJson } from './persist';
import { createStore, useStore } from './store';

const STORAGE_KEY = 'rastcamp.filters.v1';

/**
 * Selected categories. Empty = no filter (show everything) – so the first tap on
 * "Tömning" shows only dump stations, which is the main use case (spec §3 flow 1).
 */
export const filterStore = createStore<readonly Category[]>([]);

const isCategoryList = (value: unknown): value is Category[] =>
  Array.isArray(value) && value.every((v) => (CATEGORIES as readonly unknown[]).includes(v));

export async function restoreFilters(): Promise<void> {
  const saved = await loadJson(STORAGE_KEY, isCategoryList);
  if (saved) filterStore.set(CATEGORIES.filter((c) => saved.includes(c)));
}

export function toggleCategory(category: Category): void {
  filterStore.set((prev) => {
    const next = prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category];
    // Selecting every category is the same as no filter.
    const normalized =
      next.length === CATEGORIES.length ? [] : CATEGORIES.filter((c) => next.includes(c));
    void saveJson(STORAGE_KEY, normalized);
    return normalized;
  });
}

export function clearFilters(): void {
  filterStore.set([]);
  void saveJson(STORAGE_KEY, []);
}

/** Categories currently visible on map and list. */
export function visibleCategories(selected: readonly Category[]): readonly Category[] {
  return selected.length === 0 ? CATEGORIES : selected;
}

export function useSelectedCategories(): readonly Category[] {
  return useStore(filterStore);
}
