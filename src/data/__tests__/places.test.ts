import { buildPlaceIndex, decodePlaces, searchPlaces } from '../places';

import { testPlaceFile } from '../../../test/placesFixture';

const index = buildPlaceIndex(decodePlaces(testPlaceFile));
const names = (query: string, from?: { lat: number; lon: number }) =>
  searchPlaces(index, query, { from }).map((h) => h.place.name);

describe('decodePlaces', () => {
  it('decodes tuples with type, country, near and aliases', () => {
    const odensala = index.places.find((p) => p.name === 'Odensala')!;
    expect(odensala).toMatchObject({ type: 'village', country: 'SE', near: 'Östersund' });
    const helsinki = index.places.find((p) => p.name === 'Helsinki')!;
    expect(helsinki.aliases).toEqual(['Helsingfors', 'Stadi']);
    expect(helsinki.near).toBeNull();
  });

  it('returns nothing for a file it does not understand', () => {
    expect(decodePlaces(null)).toEqual([]);
    expect(decodePlaces({ schema: 2, places: [] })).toEqual([]);
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
    const towns = buildPlaceIndex(
      decodePlaces({
        ...testPlaceFile,
        places: [
          ['Sundby', 59, 17, 1, 2, -1, 900],
          ['Sundsvall', 62.39, 17.31, 1, 2, -1, 58000],
        ],
      }),
    );
    expect(searchPlaces(towns, 'sund').map((h) => h.place.name)).toEqual(['Sundsvall', 'Sundby']);
  });

  it('matches alternative names and reports the alias', () => {
    const [hit] = searchPlaces(index, 'helsingfors');
    expect(hit?.place.name).toBe('Helsinki');
    expect(hit?.matchedAlias).toBe('Helsingfors');
    expect(searchPlaces(index, 'helsinki')[0]?.matchedAlias).toBeNull();
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
