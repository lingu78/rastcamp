import {
  buildPois,
  dedupe,
  emptyCategories,
  normalizeOsmId,
  uniqueFeatures,
  type InputFeature,
  type Poi,
} from '../src/build.ts';

const M_PER_DEG_LAT = 111_195;
const point = (lat: number, lon: number) => ({
  type: 'Point' as const,
  coordinates: [lon, lat] as [number, number],
});
const feature = (
  id: string,
  tags: Record<string, string>,
  lat = 60,
  lon = 15,
  country = 'sweden',
): InputFeature => ({
  id,
  tags,
  geometry: point(lat, lon),
  country,
});
const poi = (id: string, lat: number, extra: Partial<Poi> = {}): Poi => ({
  id,
  cat: 'caravan_site',
  lat,
  lon: 15,
  name: '',
  tags: {},
  country: 'sweden',
  ...extra,
});

describe('normalizeOsmId', () => {
  it.each([
    ['n123', 'n123'],
    ['w5', 'w5'],
    ['r9', 'r9'],
    ['a200', 'w100'],
    ['a401', 'r200'],
    ['a24691378642', 'w12345689321'],
    ['x1', null],
    ['n', null],
  ])('%s → %s', (input, expected) => {
    expect(normalizeOsmId(input)).toBe(expected);
  });
});

describe('uniqueFeatures', () => {
  it('prefers the area over the linestring of the same closed way', () => {
    const line: InputFeature = {
      id: 'w100',
      tags: { tourism: 'camp_site' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [15, 60],
          [15.01, 60],
          [15, 60],
        ],
      },
      country: 'sweden',
    };
    const area: InputFeature = {
      id: 'a200',
      tags: { tourism: 'camp_site' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15, 60],
            [15.01, 60],
            [15.01, 60.01],
            [15, 60],
          ],
        ],
      },
      country: 'sweden',
    };
    const result = uniqueFeatures([line, area]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'w100', geometry: { type: 'Polygon' } });
  });

  it('keeps the first country for objects present in two extracts', () => {
    const result = uniqueFeatures([
      feature('n1', { tourism: 'camp_site' }, 60, 15, 'sweden'),
      feature('n1', { tourism: 'camp_site' }, 60, 15, 'norway'),
    ]);
    expect(result).toEqual([expect.objectContaining({ id: 'n1', country: 'sweden' })]);
  });
});

describe('dedupe (same category within 30 m)', () => {
  it('merges points closer than 30 m, keeping the richer one', () => {
    const rich = poi('n1', 60, { name: 'Ställplatsen', tags: { fee: 'yes' } });
    const poor = poi('n2', 60 + 20 / M_PER_DEG_LAT, { tags: { dog: 'yes' } });
    const { kept, removed } = dedupe([poor, rich]);
    expect(removed).toBe(1);
    expect(kept).toEqual([
      expect.objectContaining({ id: 'n1', name: 'Ställplatsen', tags: { fee: 'yes', dog: 'yes' } }),
    ]);
  });

  it('keeps points further apart than 30 m', () => {
    const { kept } = dedupe([poi('n1', 60), poi('n2', 60 + 31 / M_PER_DEG_LAT)]);
    expect(kept).toHaveLength(2);
  });

  it('never merges different categories', () => {
    const { kept } = dedupe([poi('n1', 60), poi('n2', 60, { cat: 'dump_station' })]);
    expect(kept).toHaveLength(2);
  });

  it('borrows the name from a removed duplicate if the survivor has none', () => {
    const survivor = poi('w1', 60, { tags: { fee: 'yes', shower: 'yes' } });
    const named = poi('n2', 60 + 5 / M_PER_DEG_LAT, { name: 'Bryggan' });
    // named has score 10 > survivor's 3, so named survives and gets the tags
    const { kept } = dedupe([survivor, named]);
    expect(kept).toEqual([
      expect.objectContaining({ id: 'n2', name: 'Bryggan', tags: { fee: 'yes', shower: 'yes' } }),
    ]);
  });

  it('does not mutate its input', () => {
    const a = poi('n1', 60, { name: 'A' });
    const b = poi('n2', 60, { tags: { dog: 'yes' } });
    dedupe([a, b]);
    expect(a.tags).toEqual({});
  });
});

describe('buildPois', () => {
  it('keeps drinking water only within 50 m of a dump station', () => {
    const near = 40 / M_PER_DEG_LAT;
    const far = 60 / M_PER_DEG_LAT;
    const { pois, stats } = buildPois([
      feature('n1', { amenity: 'sanitary_dump_station' }, 60, 15),
      feature('n2', { amenity: 'drinking_water' }, 60 + near, 15),
      feature('n3', { amenity: 'drinking_water' }, 60 - far, 15),
    ]);
    expect(pois.map((p) => `${p.id}/${p.cat}`)).toEqual(['n1/dump_station', 'n2/water']);
    expect(stats.drinkingWaterNearDump).toBe(1);
  });

  it('counts per category and country and rounds coordinates to 5 decimals', () => {
    const { pois, stats } = buildPois([
      feature(
        'n1',
        { tourism: 'camp_site', sanitary_dump_station: 'yes' },
        59.123456789,
        18.987654321,
      ),
      feature('n2', { highway: 'rest_area' }, 62, 10, 'norway'),
      feature('n3', { amenity: 'bench' }),
    ]);
    expect(pois).toHaveLength(3);
    expect(pois[0]).toMatchObject({ lat: 59.12346, lon: 18.98765 });
    expect(stats.counts.camp_site).toEqual({ sweden: 1 });
    expect(stats.counts.dump_station).toEqual({ sweden: 1 });
    expect(stats.counts.rest_area).toEqual({ norway: 1 });
    expect(stats.totals).toMatchObject({ camp_site: 1, dump_station: 1, rest_area: 1, lpg: 0 });
    expect(stats.total).toBe(3);
  });

  it('sorts output by category so the file is stable and compresses well', () => {
    const { pois } = buildPois([
      feature('n2', { shop: 'gas' }, 61, 15),
      feature('n1', { tourism: 'caravan_site' }, 62, 15),
      feature('n3', { tourism: 'caravan_site' }, 60, 15),
    ]);
    expect(pois.map((p) => p.id)).toEqual(['n3', 'n1', 'n2']);
  });
});

describe('emptyCategories', () => {
  it('lists the categories without POIs (build must fail on these)', () => {
    expect(
      emptyCategories({
        caravan_site: 1,
        camp_site: 2,
        dump_station: 0,
        water: 3,
        rest_area: 4,
        lpg: 0,
      }),
    ).toEqual(['dump_station', 'lpg']);
  });
});
