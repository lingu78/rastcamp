import {
  PLACE_TYPES,
  type PlaceFile,
  type PlaceTuple,
  type PlaceType,
} from '../../data-pipeline/src/placeSchema';

import { haversine } from '../utils/geo';
import { normalizeText } from './search';

export { PLACE_TYPES, type PlaceType };

export type Place = {
  /** Stable within one data version (index in the file). */
  id: number;
  name: string;
  aliases: string[];
  type: PlaceType;
  lat: number;
  lon: number;
  /** ISO country code, e.g. "SE". */
  country: string;
  /** Nearest city/town for smaller places ("near Östersund"), if any. */
  near: string | null;
  population: number;
};

/**
 * Search index over the bundled file. Places stay as compact tuples and are decoded only
 * when they are hits; the names live in one string searched with indexOf, which keeps the
 * index small (about half the memory of one object per place) and quick to build.
 */
export type PlaceIndex = {
  file: PlaceFile;
  /** Every normalised name (main name, then aliases), each followed by "\n". */
  haystack: string;
  /** Start of each name in `haystack`, plus a final entry equal to its length. */
  starts: Int32Array;
  /** Place (index in `file.places`) of each name. */
  owner: Int32Array;
  /** 0 for a main name, n for the place's n-th alias. */
  alias: Uint8Array;
};

const EMPTY_FILE: PlaceFile = {
  schema: 1,
  version: '',
  attribution: '',
  license: '',
  types: [],
  countries: [],
  places: [],
};

function isPlaceFile(data: unknown): data is PlaceFile {
  const file = data as Partial<PlaceFile> | null;
  return (
    !!file &&
    file.schema === 1 &&
    Array.isArray(file.types) &&
    Array.isArray(file.countries) &&
    Array.isArray(file.places)
  );
}

function isValidTuple(file: PlaceFile, tuple: unknown): tuple is PlaceTuple {
  if (!Array.isArray(tuple)) return false;
  const [name, lat, lon, typeIndex] = tuple as unknown[];
  const type = file.types[typeIndex as number];
  return (
    typeof name === 'string' &&
    !!type &&
    PLACE_TYPES.includes(type) &&
    Number.isFinite(lat) &&
    Number.isFinite(lon)
  );
}

function tupleAliases(tuple: PlaceTuple): string[] {
  const aliases = tuple[7];
  return Array.isArray(aliases) ? aliases.filter((a) => typeof a === 'string') : [];
}

/** Place `id` (its index in the file), or null if that entry is not a valid place. */
export function placeAt(index: PlaceIndex, id: number): Place | null {
  const { file } = index;
  const tuple = file.places[id];
  if (!isValidTuple(file, tuple)) return null;
  const [name, lat, lon, typeIndex, countryIndex, nearIndex, population] = tuple;
  return {
    id,
    name,
    aliases: tupleAliases(tuple),
    type: file.types[typeIndex]!,
    lat,
    lon,
    country: file.countries[countryIndex] ?? '',
    near: nearIndex >= 0 ? (file.places[nearIndex]?.[0] ?? null) : null,
    population: population > 0 ? population : 0,
  };
}

export function buildPlaceIndex(data: unknown): PlaceIndex {
  const file = isPlaceFile(data) ? data : EMPTY_FILE;
  const keys: string[] = [];
  const owner: number[] = [];
  const alias: number[] = [];
  for (let i = 0; i < file.places.length; i++) {
    const tuple = file.places[i];
    if (!isValidTuple(file, tuple)) continue;
    const names = [tuple[0], ...tupleAliases(tuple).slice(0, 255)];
    for (let a = 0; a < names.length; a++) {
      const key = normalizeText(names[a]!);
      if (!key) continue;
      keys.push(key);
      owner.push(i);
      alias.push(a);
    }
  }
  const starts = new Int32Array(keys.length + 1);
  let offset = 0;
  for (let k = 0; k < keys.length; k++) {
    starts[k] = offset;
    offset += keys[k]!.length + 1;
  }
  starts[keys.length] = offset;
  return {
    file,
    haystack: keys.length ? `${keys.join('\n')}\n` : '',
    starts,
    owner: Int32Array.from(owner),
    alias: Uint8Array.from(alias),
  };
}

let cached: PlaceIndex | null = null;

/** The bundled place names, indexed on first use (not at start-up). */
export function getPlaceIndex(): PlaceIndex {
  if (!cached) {
    let data: unknown = null;
    try {
      // require (not import): loaded lazily, and TypeScript doesn't type a multi-MB literal.
      data = require('../../assets/data/places.json');
    } catch {
      data = null;
    }
    cached = buildPlaceIndex(data);
  }
  return cached;
}

/** Bigger and better-known places first when the match is equally good. */
const TYPE_RANK: Record<PlaceType, number> = {
  city: 0,
  town: 1,
  national_park: 2,
  archipelago: 2,
  island: 2,
  village: 3,
  suburb: 4,
  hamlet: 5,
};

/** Map zoom when jumping to a place of this type. */
export const PLACE_ZOOM: Record<PlaceType, number> = {
  city: 11,
  town: 12,
  village: 13,
  hamlet: 13,
  suburb: 13,
  island: 10,
  archipelago: 9,
  national_park: 9,
};

/** Queries shorter than this match almost every place and are skipped. */
export const MIN_PLACE_QUERY = 2;

/**
 * 0 = whole name, 1 = name starts with it, 2 = every word starts a word, 3 = contained,
 * null = no match. `padded` is the normalised name with a leading space.
 */
function matchQuality(padded: string, query: string, words: string[]): number | null {
  for (const w of words) if (!padded.includes(w)) return null; // cheap reject first
  if (padded.length === query.length + 1 && padded.endsWith(query)) return 0;
  if (padded.startsWith(query, 1)) return 1;
  for (const w of words) if (!padded.includes(` ${w}`)) return 3;
  return 2;
}

export type PlaceHit = {
  place: Place;
  /** Set when the query matched an alternative name (e.g. "Helsingfors" for Helsinki). */
  matchedAlias: string | null;
};

/** Index of the name that contains `pos` (largest k with starts[k] <= pos), from `lo` on. */
function nameAt(starts: Int32Array, pos: number, lo: number): number {
  let hi = starts.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid]! <= pos) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Offline place search. Ranked by match quality, then place type, population and
 * distance from `from` (closest first) – fast enough for every keystroke.
 */
export function searchPlaces(
  index: PlaceIndex,
  query: string,
  { limit = 20, from }: { limit?: number; from?: { lat: number; lon: number } } = {},
): PlaceHit[] {
  const q = normalizeText(query);
  if (q.length < MIN_PLACE_QUERY) return [];
  const words = q.split(' ').filter(Boolean);
  // Scan for the longest word (fewest occurrences); the others are checked per name.
  const key = words.reduce((a, b) => (b.length > a.length ? b : a));
  const { file, haystack, starts, owner, alias } = index;

  // Best match per place: [quality, alias number].
  const best = new Map<number, [number, number]>();
  let k = 0;
  let pos = haystack.indexOf(key);
  while (pos !== -1) {
    k = nameAt(starts, pos, k);
    const end = starts[k + 1]!;
    const quality = matchQuality(` ${haystack.slice(starts[k]!, end - 1)}`, q, words);
    if (quality !== null) {
      const place = owner[k]!;
      const prev = best.get(place);
      if (!prev || quality < prev[0]) best.set(place, [quality, alias[k]!]);
    }
    pos = haystack.indexOf(key, end); // the next name
  }

  // One bucket per match quality; only as many buckets as needed get sorted.
  const buckets: { id: number; alias: number }[][] = [[], [], [], []];
  for (const [id, [quality, aliasNo]] of best) buckets[quality]!.push({ id, alias: aliasNo });

  const hits: PlaceHit[] = [];
  for (const bucket of buckets) {
    if (hits.length >= limit) break;
    const ranked = bucket.map(({ id, alias: aliasNo }) => {
      const tuple = file.places[id]!;
      return {
        id,
        alias: aliasNo,
        name: tuple[0],
        rank: TYPE_RANK[file.types[tuple[3]]!],
        population: tuple[6] > 0 ? tuple[6] : 0,
        distance: from ? haversine(from.lat, from.lon, tuple[1], tuple[2]) : 0,
      };
    });
    ranked.sort(
      (a, b) =>
        a.rank - b.rank ||
        b.population - a.population ||
        a.distance - b.distance ||
        a.name.localeCompare(b.name),
    );
    for (const r of ranked) {
      if (hits.length >= limit) break;
      const place = placeAt(index, r.id);
      if (!place) continue;
      hits.push({
        place,
        matchedAlias: r.alias > 0 ? (place.aliases[r.alias - 1] ?? null) : null,
      });
    }
  }
  return hits;
}
