import { PLACE_TYPES, type PlaceFile, type PlaceType } from '../../data-pipeline/src/placeSchema';

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

export type PlaceIndex = {
  places: Place[];
  /**
   * Normalised [name, ...aliases] per place, each with a leading space so word starts can
   * be found with includes(' ' + word); same order as `places`.
   */
  names: string[][];
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

export function decodePlaces(data: unknown): Place[] {
  if (!isPlaceFile(data)) return [];
  const places: Place[] = [];
  data.places.forEach((tuple, id) => {
    const [name, lat, lon, typeIndex, countryIndex, nearIndex, population, aliases] = tuple;
    const type = data.types[typeIndex];
    if (typeof name !== 'string' || !type || !PLACE_TYPES.includes(type)) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    places.push({
      id,
      name,
      aliases: Array.isArray(aliases) ? aliases.filter((a) => typeof a === 'string') : [],
      type,
      lat,
      lon,
      country: data.countries[countryIndex] ?? '',
      near: nearIndex >= 0 ? (data.places[nearIndex]?.[0] ?? null) : null,
      population: population > 0 ? population : 0,
    });
  });
  return places;
}

export function buildPlaceIndex(places: Place[]): PlaceIndex {
  return {
    places,
    names: places.map((p) => [p.name, ...p.aliases].map((n) => ` ${normalizeText(n)}`)),
  };
}

let cached: PlaceIndex | null = null;

/** The bundled place names, parsed on first use (not at start-up). */
export function getPlaceIndex(): PlaceIndex {
  if (!cached) {
    let data: unknown = null;
    try {
      // require (not import): loaded lazily, and TypeScript doesn't type a multi-MB literal.
      data = require('../../assets/data/places.json');
    } catch {
      data = null;
    }
    cached = buildPlaceIndex(decodePlaces(data));
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

  // One bucket per match quality; only as many buckets as needed get sorted.
  const buckets: { i: number; name: number }[][] = [[], [], [], []];
  for (let i = 0; i < index.places.length; i++) {
    const names = index.names[i]!;
    let best: number | null = null;
    let bestName = 0;
    for (let n = 0; n < names.length && best !== 0; n++) {
      const quality = matchQuality(names[n]!, q, words);
      if (quality !== null && (best === null || quality < best)) {
        best = quality;
        bestName = n;
      }
    }
    if (best !== null) buckets[best]!.push({ i, name: bestName });
  }

  const hits: PlaceHit[] = [];
  for (const bucket of buckets) {
    if (hits.length >= limit) break;
    const ranked = bucket.map(({ i, name }) => {
      const place = index.places[i]!;
      return {
        place,
        name,
        distance: from ? haversine(from.lat, from.lon, place.lat, place.lon) : 0,
      };
    });
    ranked.sort(
      (a, b) =>
        TYPE_RANK[a.place.type] - TYPE_RANK[b.place.type] ||
        b.place.population - a.place.population ||
        a.distance - b.distance ||
        a.place.name.localeCompare(b.place.name),
    );
    for (const r of ranked) {
      if (hits.length >= limit) break;
      hits.push({
        place: r.place,
        matchedAlias: r.name > 0 ? (r.place.aliases[r.name - 1] ?? null) : null,
      });
    }
  }
  return hits;
}
