import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

import { buildPois } from '../src/build.ts';
import { buildOutput } from '../src/output.ts';
import { CATEGORIES } from '../src/schema.ts';
import { validateManifest, validatePoiFile } from '../src/validate.ts';

const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');

const { pois } = buildPois([
  {
    id: 'n1',
    tags: { tourism: 'caravan_site', name: 'A', fee: 'yes' },
    geometry: { type: 'Point', coordinates: [18, 59] },
    country: 'sweden',
  },
  {
    id: 'w2',
    tags: { shop: 'gas' },
    geometry: { type: 'Point', coordinates: [10, 60] },
    country: 'norway',
  },
]);
const meta = { dataTimestamp: '2026-10-01T20:21:02Z', generated: '2026-10-02T03:00:00.000Z' };

describe('buildOutput', () => {
  const out = buildOutput(pois, meta);

  it('writes compact tuples, omitting empty tags', () => {
    expect(out.file.pois).toEqual([
      ['n1', 0, 59, 18, 'A', { fee: 'yes' }],
      ['w2', 5, 60, 10, ''],
    ]);
    expect(out.file.categories).toEqual(CATEGORIES);
    expect(out.file.version).toBe('2026-10-01');
  });

  it('manifest checksums match the published bytes', () => {
    expect(out.manifest.sha256).toBe(sha(out.gzip));
    expect(out.manifest.jsonSha256).toBe(sha(out.json));
    expect(out.manifest.bytes).toBe(out.gzip.length);
    expect(out.manifest.count).toBe(2);
    expect(out.manifest.counts).toMatchObject({ caravan_site: 1, lpg: 1, water: 0 });
    expect(gunzipSync(out.gzip).toString('utf8')).toBe(out.json);
  });

  it('is deterministic for the same input', () => {
    const again = buildOutput(pois, meta);
    expect(again.gzip.equals(out.gzip)).toBe(true);
    expect(again.manifest).toEqual(out.manifest);
  });

  it('produces a file and manifest that pass validation', () => {
    expect(validatePoiFile(JSON.parse(out.json))).toBe(true);
    expect(validateManifest(out.manifest)).toBe(true);
  });
});

describe('validatePoiFile', () => {
  const good = JSON.parse(buildOutput(pois, meta).json);

  it.each([
    ['null', null],
    ['wrong schema', { ...good, schema: 2 }],
    ['no pois', { ...good, pois: [] }],
    ['category order changed', { ...good, categories: [...CATEGORIES].reverse() }],
    ['bad id', { ...good, pois: [['x1', 0, 59, 18, '']] }],
    ['category out of range', { ...good, pois: [['n1', 6, 59, 18, '']] }],
    ['outside the Nordics', { ...good, pois: [['n1', 0, 40, 18, '']] }],
    ['non-string tag', { ...good, pois: [['n1', 0, 59, 18, '', { fee: 1 }]] }],
    ['truncated tuple', { ...good, pois: [['n1', 0, 59]] }],
  ])('rejects %s', (_label, data) => {
    expect(validatePoiFile(data)).toBe(false);
  });
});

describe('validateManifest', () => {
  const good = buildOutput(pois, meta).manifest;
  it.each([
    ['bad sha', { ...good, sha256: 'abc' }],
    ['path traversal in file', { ...good, file: '../evil.gz' }],
    ['zero bytes', { ...good, bytes: 0 }],
  ])('rejects %s', (_label, data) => {
    expect(validateManifest(data)).toBe(false);
  });
});
