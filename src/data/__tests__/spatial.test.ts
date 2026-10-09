import { haversine } from '../../../data-pipeline/src/geo';
import { featureCollectionsByCategory } from '../geojson';
import { decodePoiFile } from '../pois';
import { CATEGORIES, type PoiFile } from '../schema';
import { buildSpatialIndex, nearest } from '../spatial';
import { testPoiFile } from '../../../test/fixtures';

/** Deterministic pseudo-random dataset over the Nordics. */
function randomFile(n: number): PoiFile {
  let seed = 42;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return {
    ...testPoiFile,
    pois: Array.from({ length: n }, (_, i) => [
      `n${i + 1}`,
      Math.floor(rand() * 6),
      54 + rand() * 17,
      4 + rand() * 27,
      '',
    ]),
  };
}

describe('decodePoiFile', () => {
  it('builds unique keys and fills empty tags', () => {
    const { pois, byKey, version } = decodePoiFile(testPoiFile);
    expect(version).toBe('2026-10-08');
    expect(pois).toHaveLength(7);
    expect(byKey.get('w2/camp_site')?.name).toBe('Fjordcamping');
    expect(byKey.get('w2/dump_station')?.cat).toBe('dump_station');
    expect(byKey.get('n4/water')?.tags).toEqual({});
  });
});

describe('nearest (F5)', () => {
  const { pois } = decodePoiFile(randomFile(5000));
  const index = buildSpatialIndex(pois);
  const here = { lat: 62.4, lon: 17.3 };

  it('matches a brute-force haversine sort', () => {
    const result = nearest(index, here.lat, here.lon, CATEGORIES, 100);
    const brute = [...pois]
      .sort(
        (a, b) =>
          haversine(here.lat, here.lon, a.lat, a.lon) - haversine(here.lat, here.lon, b.lat, b.lon),
      )
      .slice(0, 100);
    expect(result.map((p) => p.key)).toEqual(brute.map((p) => p.key));
  });

  it('only returns the requested categories and respects the limit', () => {
    const result = nearest(index, here.lat, here.lon, ['water', 'lpg'], 30);
    expect(result).toHaveLength(30);
    expect(result.every((p) => p.cat === 'water' || p.cat === 'lpg')).toBe(true);
  });

  it('sorts 13k POIs well under 100 ms', () => {
    const big = buildSpatialIndex(decodePoiFile(randomFile(13_000)).pois);
    const start = performance.now();
    for (let i = 0; i < 10; i++) nearest(big, 59 + i * 0.5, 15, CATEGORIES, 100);
    expect((performance.now() - start) / 10).toBeLessThan(100);
  });

  it('handles an empty dataset', () => {
    expect(nearest(buildSpatialIndex([]), 60, 15, CATEGORIES)).toEqual([]);
  });
});

describe('featureCollectionsByCategory', () => {
  it('splits POIs per category with their index as the only property', () => {
    const { pois } = decodePoiFile(testPoiFile);
    const fc = featureCollectionsByCategory(pois);
    expect(Object.keys(fc)).toEqual([...CATEGORIES]);
    expect(fc.dump_station.features).toHaveLength(2);
    expect(fc.dump_station.features[1]).toEqual({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [18.06, 59.33] },
      properties: { i: 3 },
    });
  });
});
