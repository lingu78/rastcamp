import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

import type { Poi } from './build.ts';
import { emptyCounts } from './build.ts';
import {
  ATTRIBUTION,
  CATEGORIES,
  LICENSE,
  SCHEMA_VERSION,
  type Manifest,
  type PoiFile,
  type PoiTuple,
} from './schema.ts';

export const POI_FILE_NAME = 'pois.json.gz';
export const MAX_GZIP_BYTES = 5 * 1024 * 1024;

export const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

export function toTuple(poi: Poi): PoiTuple {
  const cat = CATEGORIES.indexOf(poi.cat);
  return Object.keys(poi.tags).length > 0
    ? [poi.id, cat, poi.lat, poi.lon, poi.name, poi.tags]
    : [poi.id, cat, poi.lat, poi.lon, poi.name];
}

export type BuiltOutput = { file: PoiFile; json: string; gzip: Buffer; manifest: Manifest };

/** Serialises POIs to the published JSON/gzip pair and its manifest. Deterministic for equal input. */
export function buildOutput(
  pois: Poi[],
  meta: { dataTimestamp: string; generated: string },
): BuiltOutput {
  const version = meta.dataTimestamp.slice(0, 10);
  const file: PoiFile = {
    schema: SCHEMA_VERSION,
    version,
    dataTimestamp: meta.dataTimestamp,
    generated: meta.generated,
    attribution: ATTRIBUTION,
    license: LICENSE,
    categories: CATEGORIES,
    pois: pois.map(toTuple),
  };
  const json = JSON.stringify(file);
  const gzip = gzipSync(json, { level: 9 });

  const counts = emptyCounts();
  for (const poi of pois) counts[poi.cat]++;

  const manifest: Manifest = {
    schema: SCHEMA_VERSION,
    version,
    dataTimestamp: meta.dataTimestamp,
    generated: meta.generated,
    file: POI_FILE_NAME,
    bytes: gzip.length,
    sha256: sha256(gzip),
    jsonSha256: sha256(json),
    count: pois.length,
    counts,
    attribution: ATTRIBUTION,
    license: LICENSE,
  };
  return { file, json, gzip, manifest };
}
