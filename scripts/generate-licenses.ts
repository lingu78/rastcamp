/**
 * Builds src/legal/licenses.json – the licence texts shown in the app (spec F10).
 *
 * Software: every npm package that actually ends up in the JS bundle (read from Metro's
 * source map) plus the main native libraries. Data: ODbL (OSM), OpenMapTiles, OpenFreeMap.
 * Re-run after adding/removing dependencies:  npm run licenses
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEXTS = join(ROOT, 'scripts', 'license-texts');
const read = (file: string) => readFileSync(join(TEXTS, file), 'utf8').trim();

type Entry = { name: string; version?: string; license: string; url?: string; text: string };

function bundledPackages(): Set<string> {
  const out = mkdtempSync(join(tmpdir(), 'rastcamp-licenses-'));
  try {
    execFileSync(
      'npx',
      [
        'expo',
        'export',
        '--platform',
        'android',
        '--platform',
        'ios',
        '--source-maps',
        '--output-dir',
        out,
      ],
      {
        cwd: ROOT,
        stdio: ['ignore', 'ignore', 'inherit'],
        env: { ...process.env, EXPO_NO_TELEMETRY: '1', CI: '1' },
      },
    );
    const names = new Set<string>();
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.map')) {
          const { sources } = JSON.parse(readFileSync(path, 'utf8')) as { sources: string[] };
          for (const source of sources) {
            const match = /node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(
              source.split('node_modules/').length > 2
                ? `node_modules/${source.split('node_modules/').at(-1)}`
                : source,
            );
            if (match?.[1]) names.add(match[1]);
          }
        }
      }
    };
    walk(out);
    return names;
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

function packageEntry(name: string): Entry | null {
  const dir = join(ROOT, 'node_modules', name);
  if (!existsSync(join(dir, 'package.json'))) return null;
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
    version: string;
    license?: string | { type: string };
    homepage?: string;
    repository?: string | { url: string };
  };
  const licenseFile = readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f));
  const license = typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'UNKNOWN');
  const text = licenseFile
    ? readFileSync(join(dir, licenseFile), 'utf8').trim()
    : `${license} (see package)`;
  return { name, version: pkg.version, license, url: pkg.homepage, text };
}

const NATIVE: Entry[] = [
  {
    name: 'MapLibre Native (Android & iOS)',
    license: 'BSD-2-Clause',
    url: 'https://github.com/maplibre/maplibre-native',
    text: read('maplibre-native.txt'),
  },
  {
    name: 'OkHttp (Android networking, used by React Native and MapLibre)',
    license: 'Apache-2.0',
    url: 'https://square.github.io/okhttp/',
    text: `Copyright Square, Inc.\n\n${read('Apache-2.0.txt')}`,
  },
];

const DATA: Entry[] = [
  {
    name: 'OpenStreetMap – platsdata / place data',
    license: 'ODbL-1.0',
    url: 'https://www.openstreetmap.org/copyright',
    text: `© OpenStreetMap contributors. The place data in Rastcamp is a derivative database of OpenStreetMap, available under the Open Database License 1.0 at https://lingu78.github.io/rastcamp/data/.\n\n${read('ODbL-1.0.txt')}`,
  },
  {
    name: 'OpenMapTiles – kartdesign / map design',
    license: 'BSD-3-Clause, CC-BY-4.0',
    url: 'https://openmaptiles.org/',
    text: read('openmaptiles.txt'),
  },
  {
    name: 'OpenFreeMap – kartserver / map tiles',
    license: 'MIT',
    url: 'https://openfreemap.org/',
    text: read('openfreemap.txt'),
  },
];

const names = [...bundledPackages()].filter((n) => n !== 'rastcamp').sort();
const software = names.map(packageEntry).filter((e): e is Entry => e !== null);
await writeFile(
  join(ROOT, 'src', 'legal', 'licenses.json'),
  JSON.stringify({ data: DATA, software: [...NATIVE, ...software] }, null, 1) + '\n',
);
console.log(
  `✔ ${software.length} bundled packages + ${NATIVE.length} native + ${DATA.length} data licences`,
);
