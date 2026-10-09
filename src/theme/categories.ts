import type { Category } from '@/data/schema';

/**
 * Marker colours per category. White glyphs sit on these, so each has ≥ 4.5:1
 * contrast against white (tested in contrast.test.ts). Orange family for dump station
 * and LPG per the design brief.
 */
export const CATEGORY_COLORS: Record<Category, string> = {
  caravan_site: '#2E6B3F',
  camp_site: '#1F6A73',
  dump_station: '#B4530F',
  water: '#1D5FA8',
  rest_area: '#6A4C93',
  lpg: '#B42318',
};

/** Hand-drawn 24×24 glyphs (stroke paths), shared by chips, list, detail and map icons. */
export const CATEGORY_GLYPHS: Record<Category, { stroke?: string[]; fill?: string[] }> = {
  caravan_site: {
    stroke: ['M2.5 16.5V8a2 2 0 0 1 2-2H14l3.5 4.5H20a1.5 1.5 0 0 1 1.5 1.5v4.5Z', 'M6 9.5h4'],
    fill: [
      'M7 19.3a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z',
      'M17 19.3a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z',
    ],
  },
  camp_site: {
    stroke: ['M12 4 3 19.5h18Z', 'm9.5 19.5 2.5-6 2.5 6'],
  },
  dump_station: {
    stroke: ['M12 3v8', 'm8.5 8 3.5 3.5L15.5 8', 'M4 14.5h16l-2.2 5.5H6.2Z'],
  },
  water: {
    stroke: ['M12 3.5s-6 6.8-6 10.8a6 6 0 0 0 12 0c0-4-6-10.8-6-10.8Z'],
  },
  rest_area: {
    stroke: ['M3 9h18', 'm7.5 9-3 10', 'm16.5 9 3 10', 'M5.2 15h13.6'],
  },
  lpg: {
    stroke: [
      'M8 9a4 4 0 0 1 8 0v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1Z',
      'M10 4h4',
      'M12 4v1.5',
      'M8 13h8',
    ],
  },
};
