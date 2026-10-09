import { palette } from '../colors';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum ratio] — 4.5 for text, 3 for large text / UI glyphs.
const pairs = [
  ['text', 'background', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'surfaceAlt', 4.5],
  ['textSecondary', 'background', 4.5],
  ['textSecondary', 'surface', 4.5],
  ['onPrimary', 'primary', 4.5],
  ['onAccent', 'accent', 4.5],
  ['primary', 'surface', 4.5],
  ['primary', 'background', 4.5],
  ['tabInactive', 'surface', 4.5],
  ['accent', 'surface', 3],
] as const;

describe.each(['light', 'dark'] as const)('%s palette meets WCAG AA', (scheme) => {
  const c = palette[scheme];
  it.each(pairs)('%s on %s ≥ %d:1', (fg, bg, min) => {
    expect(contrast(c[fg], c[bg])).toBeGreaterThanOrEqual(min);
  });
});

describe('category marker colours', () => {
  const { CATEGORY_COLORS } = jest.requireActual<typeof import('../categories')>('../categories');
  it.each(Object.entries(CATEGORY_COLORS))('white glyph on %s (%s) ≥ 4.5:1', (_cat, color) => {
    expect(contrast('#FFFFFF', color)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('category glyphs in chips', () => {
  const { CATEGORY_COLORS, CATEGORY_GLYPH_COLORS_DARK } =
    jest.requireActual<typeof import('../categories')>('../categories');
  it.each(Object.entries(CATEGORY_COLORS))('%s glyph on light surface ≥ 3:1', (_cat, color) => {
    expect(contrast(color, palette.light.surface)).toBeGreaterThanOrEqual(3);
  });
  it.each(Object.entries(CATEGORY_GLYPH_COLORS_DARK))(
    '%s glyph on dark surface ≥ 3:1',
    (_cat, color) => {
      expect(contrast(color, palette.dark.surface)).toBeGreaterThanOrEqual(3);
    },
  );
});
