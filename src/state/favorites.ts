import type { Poi } from '@/data/pois';
import { CATEGORIES, type Category } from '@/data/schema';

import { loadJson, saveJson } from './persist';
import { createStore, useStore } from './store';

const STORAGE_KEY = 'rastcamp.favorites.v1';

/**
 * A favourite stores a snapshot of the place, so it survives data updates that drop or
 * change the POI. Stored only on the device (AsyncStorage) – spec F8.
 */
export type Favorite = {
  key: string;
  osmId: string;
  cat: Category;
  name: string;
  lat: number;
  lon: number;
  addedAt: number;
};

export const favoritesStore = createStore<readonly Favorite[]>([]);

const isFavoriteList = (value: unknown): value is Favorite[] =>
  Array.isArray(value) &&
  value.every(
    (f) =>
      typeof f === 'object' &&
      f !== null &&
      typeof f.key === 'string' &&
      typeof f.osmId === 'string' &&
      (CATEGORIES as readonly unknown[]).includes(f.cat) &&
      typeof f.name === 'string' &&
      typeof f.lat === 'number' &&
      typeof f.lon === 'number' &&
      typeof f.addedAt === 'number',
  );

export async function restoreFavorites(): Promise<void> {
  const saved = await loadJson(STORAGE_KEY, isFavoriteList);
  if (saved) favoritesStore.set(saved);
}

export function toggleFavorite(poi: Poi, now = Date.now()): boolean {
  let added = false;
  favoritesStore.set((prev) => {
    const exists = prev.some((f) => f.key === poi.key);
    added = !exists;
    const next = exists
      ? prev.filter((f) => f.key !== poi.key)
      : [
          ...prev,
          {
            key: poi.key,
            osmId: poi.osmId,
            cat: poi.cat,
            name: poi.name,
            lat: poi.lat,
            lon: poi.lon,
            addedAt: now,
          },
        ];
    void saveJson(STORAGE_KEY, next);
    return next;
  });
  return added;
}

export function favoriteToPoi(f: Favorite): Poi {
  return { key: f.key, osmId: f.osmId, cat: f.cat, lat: f.lat, lon: f.lon, name: f.name, tags: {} };
}

export function useFavorites(): readonly Favorite[] {
  return useStore(favoritesStore);
}

export function useIsFavorite(key: string): boolean {
  return useFavorites().some((f) => f.key === key);
}
