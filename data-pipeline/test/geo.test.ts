import { centroid, GridIndex, haversine } from '../src/geo.ts';

describe('haversine', () => {
  it('is 0 for the same point', () => {
    expect(haversine(59.33, 18.07, 59.33, 18.07)).toBe(0);
  });

  it('matches known distances', () => {
    // Stockholm Centralstation → Oslo S ≈ 416 km
    expect(haversine(59.3303, 18.0586, 59.9111, 10.7528) / 1000).toBeCloseTo(416, -1);
    // 0.001° of latitude ≈ 111 m
    expect(haversine(60, 15, 60.001, 15)).toBeCloseTo(111.2, 0);
    // 0.001° of longitude at 60°N ≈ 55.6 m
    expect(haversine(60, 15, 60, 15.001)).toBeCloseTo(55.6, 0);
  });

  it('is symmetric', () => {
    expect(haversine(55.6, 12.5, 69.6, 18.9)).toBeCloseTo(haversine(69.6, 18.9, 55.6, 12.5), 6);
  });
});

describe('centroid', () => {
  it('returns [lat, lon] for points', () => {
    expect(centroid({ type: 'Point', coordinates: [18, 59] })).toEqual([59, 18]);
  });

  it('computes the area centroid of a polygon', () => {
    const square = [
      [18, 59],
      [18.002, 59],
      [18.002, 59.002],
      [18, 59.002],
      [18, 59],
    ] as [number, number][];
    const [lat, lon] = centroid({ type: 'Polygon', coordinates: [square] })!;
    expect(lat).toBeCloseTo(59.001, 6);
    expect(lon).toBeCloseTo(18.001, 6);
  });

  it('is not biased by vertex density (L-shape)', () => {
    // L-shaped polygon: area centroid differs from the vertex average.
    const ring = [
      [0, 0],
      [2, 0],
      [2, 1],
      [1, 1],
      [1, 2],
      [0, 2],
      [0, 0],
    ] as [number, number][];
    const [lat, lon] = centroid({ type: 'Polygon', coordinates: [ring] })!;
    expect(lon).toBeCloseTo(5 / 6, 6);
    expect(lat).toBeCloseTo(5 / 6, 6);
  });

  it('uses the largest part of a multipolygon', () => {
    const small = [
      [10, 60],
      [10.001, 60],
      [10.001, 60.001],
      [10, 60],
    ] as [number, number][];
    const big = [
      [11, 61],
      [11.01, 61],
      [11.01, 61.01],
      [11, 61.01],
      [11, 61],
    ] as [number, number][];
    const [lat, lon] = centroid({ type: 'MultiPolygon', coordinates: [[small], [big]] })!;
    expect(lat).toBeCloseTo(61.005, 6);
    expect(lon).toBeCloseTo(11.005, 6);
  });

  it('averages linestrings and handles degenerate input', () => {
    expect(
      centroid({
        type: 'LineString',
        coordinates: [
          [10, 60],
          [12, 62],
        ],
      }),
    ).toEqual([61, 11]);
    expect(centroid({ type: 'LineString', coordinates: [] })).toBeNull();
    expect(centroid({ type: 'Polygon', coordinates: [] })).toBeNull();
  });
});

describe('GridIndex', () => {
  it('finds exactly the items within the radius, also far north', () => {
    for (const lat of [55.6, 63, 69.9, 78.2]) {
      const index = new GridIndex<{ lat: number; lon: number; id: string }>(30);
      index.add({ lat, lon: 15, id: 'origin' });
      const east29 = 29 / (111_195 * Math.cos((lat * Math.PI) / 180));
      const east31 = 31 / (111_195 * Math.cos((lat * Math.PI) / 180));
      expect(index.near(lat, 15 + east29).map((i) => i.id)).toEqual(['origin']);
      expect(index.near(lat, 15 + east31)).toEqual([]);
      expect(index.near(lat + 29 / 111_195, 15).map((i) => i.id)).toEqual(['origin']);
      expect(index.near(lat + 31 / 111_195, 15)).toEqual([]);
    }
  });
});
