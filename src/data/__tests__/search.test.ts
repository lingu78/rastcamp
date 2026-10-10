import { decodePoiFile } from '../pois';
import { CATEGORIES, validatePoiFile } from '../schema';
import { buildSearchIndex, normalizeText, searchPois } from '../search';
import { testPoiFile } from '../../../test/fixtures';

describe('normalizeText', () => {
  it.each([
    ['Östersund', 'ostersund'],
    ['Tømmerås Bobilplass', 'tommeras bobilplass'],
    ['Ærøskøbing', 'aeroskobing'],
    ['  Säffle   Camping-plats! ', 'saffle camping plats'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(normalizeText(input)).toBe(expected);
  });
});

describe('searchPois (F11)', () => {
  const { pois } = decodePoiFile(testPoiFile);
  const index = buildSearchIndex(pois);

  it('matches case- and diacritic-insensitively, all words', () => {
    expect(searchPois(pois, index, 'fjord', CATEGORIES).map((p) => p.key)).toEqual([
      'w2/camp_site',
      'w2/dump_station',
    ]);
    expect(searchPois(pois, index, 'BOBIL sentrum', CATEGORIES).map((p) => p.key)).toEqual([
      'n1/caravan_site',
    ]);
    expect(searchPois(pois, index, 'bobil oslo', CATEGORIES)).toEqual([]);
  });

  it('respects the category filter and ignores empty queries', () => {
    expect(searchPois(pois, index, 'fjord', ['camp_site']).map((p) => p.key)).toEqual([
      'w2/camp_site',
    ]);
    expect(searchPois(pois, index, '   ', CATEGORIES)).toEqual([]);
  });

  it('answers in well under 200 ms on the real bundled dataset', () => {
    const file: unknown = require('../../../assets/data/pois.json');
    expect(validatePoiFile(file)).toBe(true);
    if (!validatePoiFile(file)) return;
    const real = decodePoiFile(file).pois;
    const realIndex = buildSearchIndex(real);
    const queries = ['camping', 'a', 'rast', 'ostersund', 'bobil', 'tomning', 'xyz'];
    const start = performance.now();
    for (const q of queries) searchPois(real, realIndex, q, CATEGORIES);
    expect((performance.now() - start) / queries.length).toBeLessThan(200);
    expect(searchPois(real, realIndex, 'camping', CATEGORIES).length).toBeGreaterThan(100);
  });
});
