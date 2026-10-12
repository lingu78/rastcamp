/**
 * Refreshes the POI data shipped inside the app (assets/data/pois.json) – run before every
 * release (spec §5.4). Verifies the manifest checksums and the schema before writing.
 *
 *   node scripts/update-bundled-data.ts                         # from GitHub Pages (default)
 *   node scripts/update-bundled-data.ts --dir data-pipeline/out # from a local pipeline run
 *   node scripts/update-bundled-data.ts --git origin/data-preview
 *   node scripts/update-bundled-data.ts --git origin/gh-pages:data
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { gunzipSync } from 'node:zlib';

import { validateManifest, validatePoiFile } from '../data-pipeline/src/validate.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_DATA_URL = 'https://lingu78.github.io/rastcamp/data/';

const { values } = parseArgs({
  options: { dir: { type: 'string' }, git: { type: 'string' }, url: { type: 'string' } },
});

async function read(name: string): Promise<Buffer> {
  if (values.dir) return readFile(join(values.dir, name));
  if (values.git) {
    const [ref, path = ''] = values.git.split(':');
    return execFileSync('git', ['show', `${ref}:${path ? `${path}/` : ''}${name}`], {
      maxBuffer: 64 << 20,
    });
  }
  const res = await fetch(new URL(name, values.url ?? DEFAULT_DATA_URL));
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}`);
  return Buffer.from(await res.arrayBuffer());
}

const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');

const manifest: unknown = JSON.parse((await read('manifest.json')).toString('utf8'));
if (!validateManifest(manifest)) throw new Error('Invalid manifest.json');
const gz = await read(manifest.file);
if (sha256(gz) !== manifest.sha256) throw new Error('SHA-256 mismatch for the gzip file');
const json = gunzipSync(gz).toString('utf8');
if (sha256(json) !== manifest.jsonSha256) throw new Error('SHA-256 mismatch for the JSON');
if (!validatePoiFile(JSON.parse(json))) throw new Error('POI file failed schema validation');

await writeFile(join(ROOT, 'assets/data/pois.json'), json);
await writeFile(join(ROOT, 'assets/data/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`✔ Bundled data updated to ${manifest.version} (${manifest.count} POIs)`);

// Place names for the location search (optional: older publications don't have them).
let placesGz: Buffer | null = null;
try {
  placesGz = await read('places.json.gz');
} catch {
  console.warn('! places.json.gz not found – keeping the bundled place names');
}
if (placesGz) {
  const placesJson = gunzipSync(placesGz).toString('utf8');
  const places = JSON.parse(placesJson) as { schema?: number; places?: unknown[] };
  if (places.schema !== 1 || !Array.isArray(places.places) || places.places.length < 1000) {
    throw new Error('places.json.gz does not look like a place file');
  }
  await writeFile(join(ROOT, 'assets/data/places.json'), placesJson);
  console.log(`✔ Bundled place names updated (${places.places.length} places)`);
}
