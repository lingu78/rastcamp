/**
 * Renders the map marker PNGs (assets/map/<category>[@2x|@3x].png) from the same SVG
 * glyphs the UI uses (src/theme/categories.ts). Re-run after changing a glyph or colour:
 *
 *   node scripts/generate-map-icons.ts
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { CATEGORY_COLORS, CATEGORY_GLYPHS } from '../src/theme/categories.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'map');
const BASE_SIZE = 30; // points

function markerSvg(category: keyof typeof CATEGORY_COLORS): string {
  const glyph = CATEGORY_GLYPHS[category];
  const strokes = (glyph.stroke ?? [])
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
  const fills = (glyph.fill ?? []).map((d) => `<path d="${d}" fill="#fff"/>`).join('');
  // 32-unit canvas: white ring (border) + coloured disc + glyph scaled to 0.75 and centred.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="15.5" fill="#fff"/>
    <circle cx="16" cy="16" r="13.5" fill="${CATEGORY_COLORS[category]}"/>
    <g transform="translate(7 7) scale(0.75)">${strokes}${fills}</g>
  </svg>`;
}

await mkdir(OUT, { recursive: true });
for (const category of Object.keys(CATEGORY_COLORS) as (keyof typeof CATEGORY_COLORS)[]) {
  for (const scale of [1, 2, 3]) {
    const size = BASE_SIZE * scale;
    const suffix = scale === 1 ? '' : `@${scale}x`;
    await sharp(Buffer.from(markerSvg(category)), { density: 72 * (size / 32) * 4 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(join(OUT, `${category}${suffix}.png`));
  }
  console.log(`✔ ${category}`);
}
