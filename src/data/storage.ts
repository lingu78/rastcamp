import AsyncStorage from '@react-native-async-storage/async-storage';
import { digest, CryptoDigestAlgorithm } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { gunzipSync, strFromU8, strToU8 } from 'fflate';

import { DATA_BASE_URL, UPDATE_INTERVAL_MS } from '@/config';

import { validatePoiFile, type Manifest, type PoiFile } from './schema';
import { checkForUpdate, type UpdateDeps, type UpdateResult } from './update';

const LAST_CHECK_KEY = 'rastcamp.dataLastCheck.v1';
const FETCH_TIMEOUT_MS = 20_000;

const dataDir = () => new Directory(Paths.document, 'data');
const dataFile = () => new File(Paths.document, 'data', 'pois.json');
const manifestFile = () => new File(Paths.document, 'data', 'manifest.json');

async function fetchBytes(url: string): Promise<Uint8Array> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const hash = new Uint8Array(
    await digest(CryptoDigestAlgorithm.SHA256, bytes as Uint8Array<ArrayBuffer>),
  );
  return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Write to a temp file, then move over the old one: a crash never leaves partial data. */
async function saveFile(json: string, manifest: Manifest): Promise<void> {
  const dir = dataDir();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const tmp = new File(Paths.document, 'data', 'pois.json.tmp');
  if (tmp.exists) tmp.delete();
  tmp.write(json);
  const target = dataFile();
  if (target.exists) target.delete();
  await tmp.move(target);
  manifestFile().write(JSON.stringify(manifest));
}

export const nativeUpdateDeps: UpdateDeps = {
  fetchBytes,
  sha256Hex,
  gunzip: (bytes) => gunzipSync(bytes),
  utf8: { encode: (text) => strToU8(text), decode: (bytes) => strFromU8(bytes) },
  saveFile,
  getLastCheck: async () => {
    const value = Number(await AsyncStorage.getItem(LAST_CHECK_KEY).catch(() => null));
    return Number.isFinite(value) && value > 0 ? value : null;
  },
  setLastCheck: async (time) => {
    await AsyncStorage.setItem(LAST_CHECK_KEY, String(time)).catch(() => undefined);
  },
  now: () => Date.now(),
};

/** Previously downloaded data, if present and valid. A corrupt file is removed. */
export async function loadStoredFile(): Promise<PoiFile | null> {
  try {
    const file = dataFile();
    if (!file.exists) return null;
    const data: unknown = JSON.parse(await file.text());
    if (validatePoiFile(data)) return data;
    file.delete();
    return null;
  } catch {
    return null;
  }
}

export function runUpdateCheck(currentVersion: string, force = false): Promise<UpdateResult> {
  return checkForUpdate(DATA_BASE_URL, currentVersion, nativeUpdateDeps, {
    force,
    intervalMs: UPDATE_INTERVAL_MS,
  });
}

export async function getLastCheck(): Promise<number | null> {
  return nativeUpdateDeps.getLastCheck();
}
