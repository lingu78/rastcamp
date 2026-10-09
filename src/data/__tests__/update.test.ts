import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';

import { testPoiFile } from '../../../test/fixtures';
import type { Manifest, PoiFile } from '../schema';
import { checkForUpdate, type UpdateDeps } from '../update';

const BASE = 'https://example.org/data/';
const sha = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex');

function publish(file: PoiFile, tweak: Partial<Manifest> = {}) {
  const json = JSON.stringify(file);
  const gz = new Uint8Array(gzipSync(json));
  const manifest: Manifest = {
    schema: 1,
    version: file.version,
    dataTimestamp: file.dataTimestamp,
    generated: file.generated,
    file: 'pois.json.gz',
    bytes: gz.length,
    sha256: sha(gz),
    jsonSha256: sha(json),
    count: file.pois.length,
    counts: { caravan_site: 0, camp_site: 0, dump_station: 0, water: 0, rest_area: 0, lpg: 0 },
    attribution: '',
    license: '',
    ...tweak,
  };
  return { gz, manifest };
}

function makeDeps(served: Record<string, Uint8Array | Error>, lastCheck: number | null = null) {
  const saved: { json: string; manifest: Manifest }[] = [];
  let last = lastCheck;
  const fetched: string[] = [];
  const deps: UpdateDeps = {
    fetchBytes: async (url) => {
      fetched.push(url);
      const body = served[url];
      if (!body) throw new Error('404');
      if (body instanceof Error) throw body;
      return body;
    },
    sha256Hex: async (b) => sha(b),
    gunzip: (b) => new Uint8Array(gunzipSync(b)),
    utf8: {
      encode: (t) => new TextEncoder().encode(t),
      decode: (b) => new TextDecoder().decode(b),
    },
    saveFile: async (json, manifest) => {
      saved.push({ json, manifest });
    },
    getLastCheck: async () => last,
    setLastCheck: async (t) => {
      last = t;
    },
    now: () => 1_000_000_000,
  };
  return { deps, saved, fetched, getLast: () => last };
}

const newer: PoiFile = {
  ...testPoiFile,
  version: '2026-11-03',
  dataTimestamp: '2026-11-03T20:00:00Z',
};
const enc = (o: unknown) => new TextEncoder().encode(JSON.stringify(o));

describe('checkForUpdate (F9)', () => {
  it('downloads, verifies and saves newer data', async () => {
    const { gz, manifest } = publish(newer);
    const { deps, saved, getLast } = makeDeps({
      [`${BASE}manifest.json`]: enc(manifest),
      [`${BASE}pois.json.gz`]: gz,
    });
    const result = await checkForUpdate(BASE, '2026-10-08', deps);
    expect(result).toMatchObject({ status: 'updated', file: { version: '2026-11-03' } });
    expect(saved).toHaveLength(1);
    expect(getLast()).toBe(1_000_000_000);
  });

  it('does nothing when the published data is not newer', async () => {
    const { manifest } = publish(testPoiFile);
    const { deps, saved, fetched } = makeDeps({ [`${BASE}manifest.json`]: enc(manifest) });
    expect(await checkForUpdate(BASE, '2026-10-08', deps)).toEqual({
      status: 'up-to-date',
      version: '2026-10-08',
    });
    expect(fetched).toEqual([`${BASE}manifest.json`]);
    expect(saved).toEqual([]);
  });

  it('checks at most once a day unless forced', async () => {
    const { manifest } = publish(testPoiFile);
    const recent = 1_000_000_000 - 60 * 60 * 1000;
    const { deps, fetched } = makeDeps({ [`${BASE}manifest.json`]: enc(manifest) }, recent);
    expect(await checkForUpdate(BASE, '2026-10-08', deps)).toEqual({ status: 'skipped' });
    expect(fetched).toEqual([]);
    expect((await checkForUpdate(BASE, '2026-10-08', deps, { force: true })).status).toBe(
      'up-to-date',
    );
  });

  it('works without network: fails quietly and does not consume the daily check', async () => {
    const { deps, saved, getLast } = makeDeps({
      [`${BASE}manifest.json`]: new Error('Network request failed'),
    });
    expect(await checkForUpdate(BASE, '2026-10-08', deps)).toEqual({
      status: 'failed',
      reason: 'Network request failed',
    });
    expect(saved).toEqual([]);
    expect(getLast()).toBeNull();
  });

  it.each([
    [
      'a corrupted download',
      (gz: Uint8Array) => Object.assign(new Uint8Array(gz), { [10]: gz[10]! ^ 0xff }),
      {},
      'checksum mismatch',
    ],
    ['a truncated download', (gz: Uint8Array) => gz.slice(0, gz.length - 10), {}, 'size mismatch'],
    [
      'a wrong JSON checksum',
      (gz: Uint8Array) => gz,
      { jsonSha256: 'f'.repeat(64) },
      'json checksum mismatch',
    ],
  ])('never replaces working data with %s', async (_label, mangle, tweak, reason) => {
    const { gz, manifest } = publish(newer, tweak);
    const { deps, saved } = makeDeps({
      [`${BASE}manifest.json`]: enc(manifest),
      [`${BASE}pois.json.gz`]: mangle(gz),
    });
    expect(await checkForUpdate(BASE, '2026-10-08', deps)).toEqual({ status: 'failed', reason });
    expect(saved).toEqual([]);
  });

  it('rejects data that passes checksums but not the schema', async () => {
    const broken = { ...newer, pois: [['x', 99, 0, 0, '']] } as unknown as PoiFile;
    const { gz, manifest } = publish(broken);
    const { deps, saved } = makeDeps({
      [`${BASE}manifest.json`]: enc(manifest),
      [`${BASE}pois.json.gz`]: gz,
    });
    expect(await checkForUpdate(BASE, '2026-10-08', deps)).toEqual({
      status: 'failed',
      reason: 'schema validation failed',
    });
    expect(saved).toEqual([]);
  });

  it('ignores a manifest with a newer, incompatible schema', async () => {
    const { manifest } = publish(newer, { schema: 2 });
    const { deps, saved } = makeDeps({ [`${BASE}manifest.json`]: enc(manifest) });
    expect((await checkForUpdate(BASE, '2026-10-08', deps)).status).toBe('up-to-date');
    expect(saved).toEqual([]);
  });

  it('rejects an invalid manifest', async () => {
    const { deps } = makeDeps({ [`${BASE}manifest.json`]: enc({ hello: 'world' }) });
    expect(await checkForUpdate(BASE, '2026-10-08', deps)).toEqual({
      status: 'failed',
      reason: 'invalid manifest',
    });
  });
});
