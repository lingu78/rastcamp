/**
 * Google Play feature graphic, 1024×500, per language (spec §10):
 * store/assets/feature-graphic-<lang>.png.   node scripts/generate-feature-graphic.ts
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TAGLINES = {
  sv: ['Ställplats, tömning, vatten', 'och gasol – även offline'],
  nb: ['Bobilplass, tømming, vann', 'og gass – også offline'],
  en: ['Motorhome stops, dump points,', 'water & LPG – even offline'],
} as const;

const artwork = (await readFile(join(ROOT, 'assets/brand/icon-artwork.svg'), 'utf8'))
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');
const font = 'Helvetica Neue, Helvetica, DejaVu Sans, Arial, sans-serif';
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

for (const [lang, [line1, line2]] of Object.entries(TAGLINES)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
    <defs><radialGradient id="bg" cx="25%" cy="35%" r="90%"><stop offset="0" stop-color="#357A48"/><stop offset="1" stop-color="#1F4D2C"/></radialGradient></defs>
    <rect width="1024" height="500" fill="url(#bg)"/>
    <g transform="translate(20 40) scale(0.41)">${artwork}</g>
    <text x="455" y="205" font-family="${font}" font-weight="800" font-size="84" fill="#FFF8EE">Rastcamp</text>
    <text x="458" y="280" font-family="${font}" font-weight="600" font-size="29" fill="#FFF8EE">${esc(line1)}</text>
    <text x="458" y="324" font-family="${font}" font-weight="600" font-size="29" fill="#FFF8EE">${esc(line2)}</text>
    <rect x="458" y="362" width="120" height="8" rx="4" fill="#F29A4A"/>
  </svg>`;
  const out = join(ROOT, `store/assets/feature-graphic-${lang}.png`);
  // Play wants a 24-bit PNG without alpha.
  await sharp(Buffer.from(svg))
    .flatten({ background: '#1F4D2C' })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`✔ store/assets/feature-graphic-${lang}.png`);
}
