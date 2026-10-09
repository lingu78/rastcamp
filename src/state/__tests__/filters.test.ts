import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearFilters,
  filterStore,
  restoreFilters,
  toggleCategory,
  visibleCategories,
} from '../filters';

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('category filter (F3)', () => {
  beforeEach(async () => {
    filterStore.set([]);
    await AsyncStorage.clear();
  });

  it('shows everything when nothing is selected', () => {
    expect(visibleCategories([])).toHaveLength(6);
    expect(visibleCategories(['water'])).toEqual(['water']);
  });

  it('toggles categories on and off (multi-select), in canonical order', () => {
    toggleCategory('lpg');
    toggleCategory('dump_station');
    expect(filterStore.get()).toEqual(['dump_station', 'lpg']);
    toggleCategory('lpg');
    expect(filterStore.get()).toEqual(['dump_station']);
  });

  it('treats "all six selected" as no filter', () => {
    for (const c of [
      'caravan_site',
      'camp_site',
      'dump_station',
      'water',
      'rest_area',
      'lpg',
    ] as const) {
      toggleCategory(c);
    }
    expect(filterStore.get()).toEqual([]);
  });

  it('persists the last selection and restores it on start', async () => {
    toggleCategory('water');
    toggleCategory('caravan_site');
    await flush();
    filterStore.set([]);
    await restoreFilters();
    expect(filterStore.get()).toEqual(['caravan_site', 'water']);
  });

  it('ignores corrupt stored values', async () => {
    await AsyncStorage.setItem('rastcamp.filters.v1', '{"not":"a list"}');
    await restoreFilters();
    expect(filterStore.get()).toEqual([]);
    await AsyncStorage.setItem('rastcamp.filters.v1', '["water","bogus"]');
    await restoreFilters();
    expect(filterStore.get()).toEqual([]);
  });

  it('clearFilters resets and persists', async () => {
    toggleCategory('water');
    clearFilters();
    await flush();
    expect(filterStore.get()).toEqual([]);
    expect(await AsyncStorage.getItem('rastcamp.filters.v1')).toBe('[]');
  });
});
