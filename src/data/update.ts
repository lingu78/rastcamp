import {
  SCHEMA_VERSION,
  validateManifest,
  validatePoiFile,
  type Manifest,
  type PoiFile,
} from './schema';

/** Everything with side effects is injected, so the update logic is unit-testable. */
export type UpdateDeps = {
  fetchBytes: (url: string) => Promise<Uint8Array>;
  sha256Hex: (bytes: Uint8Array) => Promise<string>;
  gunzip: (bytes: Uint8Array) => Uint8Array;
  utf8: { encode: (text: string) => Uint8Array; decode: (bytes: Uint8Array) => string };
  /** Atomically replaces the stored data file (never leaves a half-written file behind). */
  saveFile: (json: string, manifest: Manifest) => Promise<void>;
  getLastCheck: () => Promise<number | null>;
  setLastCheck: (time: number) => Promise<void>;
  now: () => number;
};

export type UpdateResult =
  | { status: 'skipped' }
  | { status: 'up-to-date'; version: string }
  | { status: 'updated'; file: PoiFile }
  | { status: 'failed'; reason: string };

/** "YYYY-MM-DD" versions compare correctly as strings. */
export const isNewer = (candidate: string, current: string) => candidate > current;

/**
 * Spec F9: at most once a day (unless forced), fetch the manifest; if it announces newer
 * data, download it, verify size + SHA-256 (gzip and JSON) + schema, and only then save it.
 * Any failure leaves the current data untouched. Never throws.
 */
export async function checkForUpdate(
  baseUrl: string,
  currentVersion: string,
  deps: UpdateDeps,
  { force = false, intervalMs = 24 * 60 * 60 * 1000 } = {},
): Promise<UpdateResult> {
  try {
    const last = await deps.getLastCheck();
    if (!force && last !== null && deps.now() - last < intervalMs) return { status: 'skipped' };

    const manifestBytes = await deps.fetchBytes(new URL('manifest.json', baseUrl).toString());
    const manifest: unknown = JSON.parse(deps.utf8.decode(manifestBytes));
    if (!validateManifest(manifest)) return { status: 'failed', reason: 'invalid manifest' };
    // A successful manifest fetch counts as today's check, whatever the outcome below.
    await deps.setLastCheck(deps.now());
    if (manifest.schema !== SCHEMA_VERSION || !isNewer(manifest.version, currentVersion)) {
      return { status: 'up-to-date', version: currentVersion };
    }

    const gz = await deps.fetchBytes(new URL(manifest.file, baseUrl).toString());
    if (gz.length !== manifest.bytes) return { status: 'failed', reason: 'size mismatch' };
    if ((await deps.sha256Hex(gz)) !== manifest.sha256)
      return { status: 'failed', reason: 'checksum mismatch' };

    const jsonBytes = deps.gunzip(gz);
    if ((await deps.sha256Hex(jsonBytes)) !== manifest.jsonSha256) {
      return { status: 'failed', reason: 'json checksum mismatch' };
    }
    const json = deps.utf8.decode(jsonBytes);
    const file: unknown = JSON.parse(json);
    if (!validatePoiFile(file) || file.version !== manifest.version) {
      return { status: 'failed', reason: 'schema validation failed' };
    }

    await deps.saveFile(json, manifest);
    return { status: 'updated', file };
  } catch (error) {
    return { status: 'failed', reason: error instanceof Error ? error.message : String(error) };
  }
}
