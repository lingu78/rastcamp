/**
 * Renders every app icon/splash asset from assets/brand/icon-artwork.svg (spec §8):
 *   assets/images/icon.png                – 1024², iOS + default (green background, full bleed)
 *   assets/images/adaptive-foreground.png – Android adaptive icon foreground (safe zone)
 *   assets/images/adaptive-monochrome.png – Android 13+ themed icon
 *   assets/images/splash-icon.png         – splash image (on green, set in app.json)
 *   assets/images/favicon.png             – web preview
 *   store/assets/play-icon-512.png        – Google Play hi-res icon
 *
 *   node scripts/generate-app-icons.ts
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GREEN = '#2E6B3F';
const GREEN_DARK = '#1F4D2C';

const artwork = await readFile(join(ROOT, 'assets/brand/icon-artwork.svg'), 'utf8');
const inner = artwork.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** Artwork scaled by `scale` around the centre, optional background and colour override. */
function compose({
  scale = 1,
  background,
  monochrome = false,
}: {
  scale?: number;
  background?: boolean;
  monochrome?: boolean;
}) {
  const offset = (1024 * (1 - scale)) / 2;
  const body = monochrome ? inner.replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#FFFFFF"') : inner;
  // In monochrome, the "holes" (windows, wheel hubs) must be cut out, not painted white.
  const mono = monochrome
    ? inner
        .replace(/fill="#(FFF8EE|F29A4A)"/g, 'fill="#FFFFFF"')
        .replace(/fill="#(2E6B3F|173A22|FFFAF2)"/g, 'fill="#000000"')
    : body;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <defs>
      <radialGradient id="bg" cx="50%" cy="30%" r="80%">
        <stop offset="0" stop-color="${GREEN}"/><stop offset="1" stop-color="${GREEN_DARK}"/>
      </radialGradient>
      ${monochrome ? '<mask id="m"><rect width="1024" height="1024" fill="#000"/><g transform="translate(' + offset + ' ' + offset + ') scale(' + scale + ')">' + mono + '</g></mask>' : ''}
    </defs>
    ${background ? '<rect width="1024" height="1024" fill="url(#bg)"/>' : ''}
    ${monochrome ? '<rect width="1024" height="1024" fill="#FFFFFF" mask="url(#m)"/>' : `<g transform="translate(${offset} ${offset}) scale(${scale})">${body}</g>`}
  </svg>`;
}

async function render(svg: string, size: number, out: string, flatten = false) {
  await mkdir(dirname(join(ROOT, out)), { recursive: true });
  let img = sharp(Buffer.from(svg), { density: 300 }).resize(size, size);
  if (flatten) img = img.flatten({ background: GREEN });
  await img.png({ compressionLevel: 9 }).toFile(join(ROOT, out));
  console.log(`✔ ${out} (${size}²)`);
}

// iOS/Play icons: no transparency allowed → flatten onto green.
await render(compose({ scale: 0.92, background: true }), 1024, 'assets/images/icon.png', true);
await render(
  compose({ scale: 0.92, background: true }),
  512,
  'store/assets/play-icon-512.png',
  true,
);
// Android adaptive: the system masks to a circle/squircle; keep artwork inside the 66% safe zone.
await render(compose({ scale: 0.62 }), 1024, 'assets/images/adaptive-foreground.png');
await render(
  compose({ scale: 0.62, monochrome: true }),
  1024,
  'assets/images/adaptive-monochrome.png',
);
await render(compose({ scale: 1 }), 512, 'assets/images/splash-icon.png');
await render(compose({ scale: 0.92, background: true }), 48, 'assets/images/favicon.png', true);
