import { bearing, cardinal, formatDistance, haversine } from '../geo';

describe('formatDistance (F5)', () => {
  it.each([
    [20, 'sv', '< 0,1 km'],
    [420, 'sv', '0,4 km'],
    [3249, 'sv', '3,2 km'],
    [3249, 'en', '3.2 km'],
    [9949, 'nb', '9,9 km'],
    [9960, 'nb', '10,0 km'],
    [10_000, 'sv', '10 km'],
    [123_456, 'sv', '123 km'],
  ] as const)('%d m (%s) → %s', (meters, lang, expected) => {
    expect(formatDistance(meters, lang)).toBe(expected);
  });
});

describe('bearing & cardinal', () => {
  it('points the right way', () => {
    expect(bearing(60, 15, 61, 15)).toBeCloseTo(0, 5);
    expect(bearing(60, 15, 60, 16)).toBeCloseTo(89.57, 1);
    expect(bearing(60, 15, 59, 15)).toBeCloseTo(180, 5);
    expect(bearing(60, 15, 60, 14)).toBeCloseTo(270.43, 1);
  });

  it.each([
    [0, 'sv', 'N'],
    [44, 'sv', 'NO'],
    [90, 'nb', 'Ø'],
    [135, 'en', 'SE'],
    [200, 'sv', 'S'],
    [247, 'nb', 'SV'],
    [292, 'en', 'W'],
    [337.6, 'sv', 'N'],
    [-45, 'sv', 'NV'],
  ] as const)('%d° (%s) → %s', (deg, lang, expected) => {
    expect(cardinal(deg, lang)).toBe(expected);
  });

  it('re-exports the pipeline haversine', () => {
    expect(haversine(59.3303, 18.0586, 59.9111, 10.7528) / 1000).toBeCloseTo(416, -1);
  });
});
