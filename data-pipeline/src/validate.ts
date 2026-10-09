import { CATEGORIES, SCHEMA_VERSION, type Manifest, type PoiFile } from './schema.ts';

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Bounding box of SE/NO/FI/DK incl. Svalbard, with margin. */
const LAT_RANGE = [53, 82] as const;
const LON_RANGE = [-12, 35] as const;

function isValidPoi(p: unknown): boolean {
  if (!Array.isArray(p) || (p.length !== 5 && p.length !== 6)) return false;
  const [id, cat, lat, lon, name, tags] = p as unknown[];
  return (
    typeof id === 'string' &&
    /^[nwr]\d+$/.test(id) &&
    typeof cat === 'number' &&
    Number.isInteger(cat) &&
    cat >= 0 &&
    cat < CATEGORIES.length &&
    typeof lat === 'number' &&
    lat >= LAT_RANGE[0] &&
    lat <= LAT_RANGE[1] &&
    typeof lon === 'number' &&
    lon >= LON_RANGE[0] &&
    lon <= LON_RANGE[1] &&
    typeof name === 'string' &&
    (tags === undefined ||
      (isObject(tags) && Object.values(tags).every((v) => typeof v === 'string')))
  );
}

/**
 * Structural validation of a parsed POI file. Used by the pipeline before publishing
 * and by the app before replacing its working data with a download (spec F9).
 */
export function validatePoiFile(data: unknown): data is PoiFile {
  if (!isObject(data)) return false;
  if (data.schema !== SCHEMA_VERSION) return false;
  if (typeof data.version !== 'string' || typeof data.dataTimestamp !== 'string') return false;
  if (!Array.isArray(data.categories) || data.categories.join() !== CATEGORIES.join()) return false;
  if (!Array.isArray(data.pois) || data.pois.length === 0) return false;
  return data.pois.every(isValidPoi);
}

export function validateManifest(data: unknown): data is Manifest {
  if (!isObject(data)) return false;
  return (
    typeof data.schema === 'number' &&
    typeof data.version === 'string' &&
    typeof data.file === 'string' &&
    /^[\w.-]+$/.test(data.file) &&
    typeof data.sha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(data.sha256) &&
    typeof data.jsonSha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(data.jsonSha256) &&
    typeof data.bytes === 'number' &&
    data.bytes > 0 &&
    typeof data.count === 'number' &&
    data.count > 0
  );
}
