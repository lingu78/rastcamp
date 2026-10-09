import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Poi } from '@/data/pois';

import { favoritesStore, restoreFavorites, toggleFavorite } from '../favorites';

const poi: Poi = {
  key: 'n1/water',
  osmId: 'n1',
  cat: 'water',
  lat: 60,
  lon: 15,
  name: 'Brunn',
  tags: { fee: 'no' },
};
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('favourites (F8)', () => {
  beforeEach(async () => {
    favoritesStore.set([]);
    await AsyncStorage.clear();
  });

  it('toggles a favourite on and off', () => {
    expect(toggleFavorite(poi, 1000)).toBe(true);
    expect(favoritesStore.get()).toEqual([
      {
        key: 'n1/water',
        osmId: 'n1',
        cat: 'water',
        name: 'Brunn',
        lat: 60,
        lon: 15,
        addedAt: 1000,
      },
    ]);
    expect(toggleFavorite(poi)).toBe(false);
    expect(favoritesStore.get()).toEqual([]);
  });

  it('survives a restart (persisted locally only)', async () => {
    toggleFavorite(poi, 1000);
    await flush();
    favoritesStore.set([]); // simulate a cold start
    await restoreFavorites();
    expect(favoritesStore.get().map((f) => f.key)).toEqual(['n1/water']);
    expect(Object.keys(await AsyncStorage.getAllKeys())).toHaveLength(1);
  });

  it('ignores corrupt storage', async () => {
    await AsyncStorage.setItem('rastcamp.favorites.v1', '[{"key":1}]');
    await restoreFavorites();
    expect(favoritesStore.get()).toEqual([]);
  });
});
