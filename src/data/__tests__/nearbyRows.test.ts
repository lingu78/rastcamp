import { buildPoiData } from '../DataProvider';
import { MAX_ROWS, nearbyRows } from '../nearbyRows';
import { CATEGORIES, type PoiFile } from '../schema';
import { testPoiFile } from '../../../test/fixtures';

const many: PoiFile = {
  ...testPoiFile,
  pois: Array.from({ length: 150 }, (_, i) => [`n${i + 1}`, 3, 59 + i * 0.01, 18, `Post ${i}`]),
};

describe('nearbyRows (F5/F11)', () => {
  const data = buildPoiData(many);

  it('returns at most 100 rows, nearest first', () => {
    const rows = nearbyRows(data, CATEGORIES, '', 59, 18);
    expect(rows).toHaveLength(MAX_ROWS);
    expect(rows[0]?.name).toBe('Post 0');
    expect(rows[99]?.name).toBe('Post 99');
  });

  it('caps and distance-sorts search results too', () => {
    const rows = nearbyRows(data, CATEGORIES, 'post', 60.5, 18);
    expect(rows).toHaveLength(MAX_ROWS);
    expect(rows[0]?.name).toBe('Post 149');
  });
});
