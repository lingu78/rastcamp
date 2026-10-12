import { buildPlaceIndex, placeAt, searchPlaces } from '../places';

import { testPlaceFile } from '../../../test/placesFixture';

const index = buildPlaceIndex(testPlaceFile);
const names = (query: string, from?: { lat: number; lon: number }) =>
  searchPlaces(index, query, { from }).map((h) => h.place.name);

describe('placeAt', () => {
  it('decodes tuples with type, country, near and aliases; the id is the file index', () => {
    expect(placeAt(index, 5)).toMatchObject({
      id: 5,
      name: 'Odensala',
      type: 'village',
      country: 'SE',
      near: 'Östersund',
    });
    const helsinki = placeAt(index, 0)!;
    expect(helsinki.aliases).toEqual(['Helsingfors', 'Stadi']);
    expect(helsinki.near).toBeNull();
    expect(placeAt(index, 999)).toBeNull();
  });
});

describe('buildPlaceIndex', () => {
  it('finds nothing in a file it does not understand', () => {
    expect(searchPlaces(buildPlaceIndex(null), 'helsinki')).toEqual([]);
    expect(searchPlaces(buildPlaceIndex({ schema: 2, places: [] }), 'helsinki')).toEqual([]);
  });

  it('skips invalid entries but keeps the ids of the others', () => {
    const odd = buildPlaceIndex({
      ...testPlaceFile,
      places: [
        ['Nowhere', Number.NaN, 14, 1, 2, -1, 0],
        ['Badtype', 60, 14, 42, 2, -1, 0],
        ['Brunflo', 63.07, 14.82, 2, 2, -1, 0],
      ],
    });
    expect(searchPlaces(odd, 'nowhere')).toEqual([]);
    expect(searchPlaces(odd, 'badtype')).toEqual([]);
    expect(searchPlaces(odd, 'brunflo').map((h) => h.place.id)).toEqual([2]);
  });
});

describe('searchPlaces', () => {
  it('finds places without Nordic characters', () => {
    expect(names('ostersund')).toEqual(['Östersund']);
    expect(names('are')).toContain('Åre');
  });

  it('ranks the exact name first, then names starting with the query', () => {
    expect(names('åre')[0]).toBe('Åre');
    expect(names('sto')).toEqual(['Stockholm', 'Storuman']);
  });

  it('prefers bigger places when the match is equally good', () => {
    const towns = buildPlaceIndex({
      ...testPlaceFile,
      places: [
        ['Sundby', 59, 17, 1, 2, -1, 900],
        ['Sundsvall', 62.39, 17.31, 1, 2, -1, 58000],
      ],
    });
    expect(searchPlaces(towns, 'sund').map((h) => h.place.name)).toEqual(['Sundsvall', 'Sundby']);
  });

  it('matches alternative names and reports the alias', () => {
    const [hit] = searchPlaces(index, 'helsingfors');
    expect(hit?.place.name).toBe('Helsinki');
    expect(hit?.matchedAlias).toBe('Helsingfors');
    expect(searchPlaces(index, 'helsinki')[0]?.matchedAlias).toBeNull();
  });

  it('finds a name matched only by an alias, and repeated occurrences once', () => {
    const odd = buildPlaceIndex({
      ...testPlaceFile,
      places: [
        ['Bergsberg', 60, 15, 2, 2, -1, 0],
        ['Inari', 68.9, 27.0, 2, 0, -1, 0, ['Anár', 'Aanaar']],
        ['Berg', 61, 15, 3, 2, -1, 0],
      ],
    });
    expect(searchPlaces(odd, 'berg').map((h) => h.place.name)).toEqual(['Berg', 'Bergsberg']);
    const [inari] = searchPlaces(odd, 'anar');
    expect(inari?.place.name).toBe('Inari');
    expect(inari?.matchedAlias).toBe('Anár');
  });

  it('matches word starts in multi-word names', () => {
    expect(names('abisko park')).toEqual(['Abisko nationalpark']);
    expect(names('national park')).toEqual(['Abisko nationalpark']);
  });

  it('orders same-named places by distance', () => {
    const fromStockholm = searchPlaces(index, 'berg', { from: { lat: 59.33, lon: 18.07 } });
    expect(fromStockholm.map((h) => h.place.lat)).toEqual([59.5, 63.0]);
    const fromOstersund = searchPlaces(index, 'berg', { from: { lat: 63.17, lon: 14.6 } });
    expect(fromOstersund.map((h) => h.place.lat)).toEqual([63.0, 59.5]);
  });

  it('needs at least two characters and respects the limit', () => {
    expect(searchPlaces(index, '  ')).toEqual([]);
    expect(searchPlaces(index, 'o')).toEqual([]);
    expect(searchPlaces(index, 'er')).toHaveLength(4);
    expect(searchPlaces(index, 'er', { limit: 2 })).toHaveLength(2);
  });
});
