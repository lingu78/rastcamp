/**
 * Rastcamp data pipeline CLI.
 *
 *   node data-pipeline/src/run.ts                       # download SE/NO/FI/DK from Geofabrik and build
 *   node data-pipeline/src/run.ts --skip-download       # reuse PBFs already in data-pipeline/work/
 *   node data-pipeline/src/run.ts --input a.osm.pbf     # build from local file(s) instead (repeatable)
 *
 * Requires `osmium` (osmium-tool) on PATH. Outputs to data-pipeline/out/:
 *   pois.json.gz, pois.json, manifest.json, report.json
 */
import { execFileSync } from 'node:child_process';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';

import { buildPois, emptyCategories, type InputFeature } from './build.ts';
import { classify, OSMIUM_FILTERS } from './categorize.ts';
import { buildOutput, MAX_GZIP_BYTES } from './output.ts';
import { CATEGORIES, type Category } from './schema.ts';
import { validatePoiFile } from './validate.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const COUNTRIES = ['sweden', 'norway', 'finland', 'denmark'] as const;
const GEOFABRIK = 'https://download.geofabrik.de/europe';

const { values: args } = parseArgs({
  options: {
    'skip-download': { type: 'boolean', default: false },
    input: { type: 'string', multiple: true },
    countries: { type: 'string', default: COUNTRIES.join(',') },
    work: { type: 'string', default: join(ROOT, 'work') },
    out: { type: 'string', default: join(ROOT, 'out') },
  },
});

const log = (msg: string) => console.log(`[pipeline] ${msg}`);

function osmium(...argv: string[]): string {
  return execFileSync('osmium', argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

async function md5(path: string): Promise<string> {
  const hash = createHash('md5');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

async function download(country: string, target: string): Promise<void> {
  const url = `${GEOFABRIK}/${country}-latest.osm.pbf`;
  const expected = (await (await fetch(`${url}.md5`)).text()).trim().split(/\s+/)[0];
  if (existsSync(target) && (await md5(target)) === expected) {
    log(`${country}: cached PBF is current`);
    return;
  }
  log(`${country}: downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}): ${url}`);
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(target));
  const actual = await md5(target);
  if (actual !== expected) throw new Error(`MD5 mismatch for ${country}: ${actual} ≠ ${expected}`);
  log(`${country}: ${((await stat(target)).size / 1e6).toFixed(0)} MB, MD5 OK`);
}

function dataTimestamp(pbf: string): string | null {
  try {
    const ts = osmium('fileinfo', '-g', 'header.option.osmosis_replication_timestamp', pbf).trim();
    return ts || null;
  } catch {
    return null;
  }
}

async function* readFeatures(geojsonseq: string, country: string): AsyncGenerator<InputFeature> {
  const lines = createInterface({ input: createReadStream(geojsonseq), crlfDelay: Infinity });
  for await (const raw of lines) {
    const line = raw.replace(/^\x1e/, '').trim();
    if (!line) continue;
    const feature = JSON.parse(line) as {
      id?: string;
      geometry: InputFeature['geometry'] | null;
      properties: Record<string, string>;
    };
    if (!feature.id || !feature.geometry) continue;
    yield { id: feature.id, tags: feature.properties ?? {}, geometry: feature.geometry, country };
  }
}

type KeyReport = Record<Category, Record<string, number>>;

async function main() {
  await mkdir(args.work, { recursive: true });
  await mkdir(args.out, { recursive: true });

  const sources: { country: string; pbf: string }[] = [];
  if (args.input?.length) {
    for (const input of args.input) {
      sources.push({ country: basename(input).replace(/[-.].*$/, ''), pbf: resolve(input) });
    }
  } else {
    for (const country of args.countries.split(',').map((c) => c.trim())) {
      const pbf = join(args.work, `${country}-latest.osm.pbf`);
      if (!args['skip-download']) await download(country, pbf);
      else if (!existsSync(pbf)) throw new Error(`Missing ${pbf} (run without --skip-download)`);
      sources.push({ country, pbf });
    }
  }

  const features: InputFeature[] = [];
  const timestamps: string[] = [];
  const keyReport = Object.fromEntries(CATEGORIES.map((c) => [c, {}])) as KeyReport;

  for (const { country, pbf } of sources) {
    const filtered = join(args.work, `${country}-filtered.osm.pbf`);
    const geojson = join(args.work, `${country}.geojsonseq`);
    log(`${country}: osmium tags-filter`);
    osmium('tags-filter', pbf, ...OSMIUM_FILTERS, '-o', filtered, '--overwrite');
    log(`${country}: osmium export`);
    osmium(
      'export',
      filtered,
      '-f',
      'geojsonseq',
      '-x',
      'print_record_separator=false',
      '--add-unique-id=type_id',
      '--geometry-types=point,linestring,polygon',
      '-o',
      geojson,
      '--overwrite',
    );
    const ts = dataTimestamp(pbf);
    if (ts) timestamps.push(ts);

    let n = 0;
    for await (const feature of readFeatures(geojson, country)) {
      features.push(feature);
      n++;
      for (const cat of classify(feature.tags).categories) {
        for (const key of Object.keys(feature.tags)) {
          keyReport[cat][key] = (keyReport[cat][key] ?? 0) + 1;
        }
      }
    }
    log(`${country}: ${n} candidate features (data timestamp ${ts ?? 'unknown'})`);
  }

  const { pois, stats } = buildPois(features);
  const dataTs = timestamps.sort()[0] ?? new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const output = buildOutput(pois, { dataTimestamp: dataTs, generated: new Date().toISOString() });

  // Report: counts per category and country (spec §5.3 "rimlighetskontroll").
  const countries = sources.map((s) => s.country);
  const header = ['category', ...countries, 'total'];
  const rows = CATEGORIES.map((cat) => [
    cat,
    ...countries.map((c) => String(stats.counts[cat][c] ?? 0)),
    String(stats.totals[cat]),
  ]);
  console.log('\n' + [header, ...rows].map((r) => r.map((v) => v.padEnd(14)).join('')).join('\n'));
  console.log(
    `\nTotal POIs: ${stats.total}  (duplicates removed: ${stats.duplicatesRemoved}, ` +
      `drinking water next to dump station: ${stats.drinkingWaterNearDump})`,
  );
  console.log(
    `pois.json: ${(output.json.length / 1e6).toFixed(2)} MB, pois.json.gz: ${(output.gzip.length / 1e6).toFixed(2)} MB`,
  );

  const topKeys = Object.fromEntries(
    CATEGORIES.map((cat) => [
      cat,
      Object.fromEntries(
        Object.entries(keyReport[cat])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 40),
      ),
    ]),
  );

  await writeFile(join(args.out, 'pois.json'), output.json);
  await writeFile(join(args.out, 'pois.json.gz'), output.gzip);
  await writeFile(join(args.out, 'manifest.json'), JSON.stringify(output.manifest, null, 2) + '\n');
  await writeFile(
    join(args.out, 'report.json'),
    JSON.stringify({ stats, sources: countries, dataTimestamp: dataTs, topKeys }, null, 2) + '\n',
  );
  log(`wrote ${args.out}`);

  // Fail the build on anything that should never be published.
  const problems: string[] = [];
  const empty = emptyCategories(stats.totals);
  if (empty.length) problems.push(`categories with 0 POIs: ${empty.join(', ')}`);
  if (output.gzip.length > MAX_GZIP_BYTES) problems.push(`gzip is larger than 5 MB`);
  if (!validatePoiFile(JSON.parse(await readFile(join(args.out, 'pois.json'), 'utf8')))) {
    problems.push('output failed schema validation');
  }
  if (problems.length) {
    console.error(`\n✖ Build failed: ${problems.join('; ')}`);
    process.exit(1);
  }
  console.log('\n✔ Build OK');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
