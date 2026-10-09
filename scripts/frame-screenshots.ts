/**
 * Turns raw device screenshots (store/screenshots/raw/<platform>/<lang>/NN-name.png) into
 * store-ready images with a caption band (store/screenshots/final/<platform>/<lang>/…):
 *   android → 1080×1920 (9:16, Play requires ≤ 2:1)
 *   ios     → 1320×2868 (6.9" iPhone, required size)
 *
 *   node scripts/frame-screenshots.ts [android|ios ...]
 */
import { existsSync, readdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SIZES = { android: [1080, 1920], ios: [1320, 2868] } as const;
type Platform = keyof typeof SIZES;

export const CAPTIONS: Record<string, Record<'sv' | 'nb' | 'en', string>> = {
  '01-map-filter': {
    sv: 'Hitta närmaste ställplats och tömning',
    nb: 'Finn nærmeste bobilplass og tømming',
    en: 'Find the nearest motorhome stop and dump station',
  },
  '02-nearby': {
    sv: 'Sorterat efter avstånd – med riktning',
    nb: 'Sortert etter avstand – med retning',
    en: 'Sorted by distance – with direction',
  },
  '03-detail': {
    sv: 'Avgift, el, dusch, tömning – och vägbeskrivning',
    nb: 'Avgift, strøm, dusj, tømming – og veibeskrivelse',
    en: 'Fees, power, showers, disposal – and directions',
  },
  '04-favorites': {
    sv: 'Spara favoriter för resan',
    nb: 'Lagre favoritter for turen',
    en: 'Save favourites for the trip',
  },
  '05-offline': {
    sv: 'Fungerar utan täckning',
    nb: 'Fungerer uten dekning',
    en: 'Works without signal',
  },
};

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Splits a caption into at most two balanced lines. */
function lines(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  let best: [string, string] = [text, ''];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) [best, bestDiff] = [[a, b], diff];
  }
  return best;
}

async function frame(platform: Platform, lang: 'sv' | 'nb' | 'en', file: string): Promise<void> {
  const [W, H] = SIZES[platform];
  const key = file.replace(/\.png$/, '');
  const caption = CAPTIONS[key]?.[lang] ?? '';
  const band = Math.round(H * 0.17);
  const margin = Math.round(W * 0.07);
  const shotH = H - band - margin;
  const raw = sharp(join(ROOT, 'store/screenshots/raw', platform, lang, file));
  const meta = await raw.metadata();
  const shotW = Math.round(((meta.width ?? W) / (meta.height ?? H)) * shotH);
  const radius = Math.round(W * 0.05);
  const shot = await raw
    .resize(shotW, shotH)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${shotW}" height="${shotH}"><rect width="${shotW}" height="${shotH}" rx="${radius}" ry="${radius}"/></svg>`,
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
  const fontSize = Math.round(W * 0.062);
  const textLines = lines(caption, 26);
  const textY = band / 2 - ((textLines.length - 1) * fontSize * 1.2) / 2 + fontSize * 0.35;
  const text = textLines
    .map(
      (l, i) =>
        `<text x="${W / 2}" y="${textY + i * fontSize * 1.2}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="#FFFFFF">${escapeXml(l)}</text>`,
    )
    .join('');
  const background = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E6B3F"/><stop offset="1" stop-color="#1F4D2C"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>${text}</svg>`;
  const out = join(ROOT, 'store/screenshots/final', platform, lang, file);
  await mkdir(dirname(out), { recursive: true });
  await sharp(Buffer.from(background))
    .composite([{ input: shot, left: Math.round((W - shotW) / 2), top: band }])
    .flatten({ background: '#1F4D2C' })
    .png({ compressionLevel: 9 })
    .toFile(out);
}

const platforms = (
  process.argv.slice(2).length ? process.argv.slice(2) : ['android', 'ios']
) as Platform[];
for (const platform of platforms) {
  for (const lang of ['sv', 'nb', 'en'] as const) {
    const dir = join(ROOT, 'store/screenshots/raw', platform, lang);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)
      .filter((f) => f.endsWith('.png'))
      .sort()) {
      await frame(platform, lang, file);
      console.log(`✔ ${platform}/${lang}/${file}`);
    }
  }
}
