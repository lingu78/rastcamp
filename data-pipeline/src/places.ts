/**
 * Place names for the offline location search: towns, villages, districts, notable
 * islands and national parks from the same OSM extracts as the POIs.
 */
import { gzipSync } from 'node:zlib';

import { type InputFeature, uniqueFeatures } from './build.ts';
import type { OsmTags } from './categorize.ts';
import { centroid, GridIndex, haversine } from './geo.ts';

import { PLACE_TYPES, type PlaceFile, type PlaceTuple, type PlaceType } from './placeSchema.ts';

export { PLACE_TYPES, type PlaceFile, type PlaceTuple, type PlaceType };

/** `osmium tags-filter` expressions – a superset of what classifyPlace accepts. */
export const PLACE_FILTERS = [
  'n/place=city,town,village,hamlet,suburb',
  'nwr/place=island,archipelago',
  'nwr/boundary=national_park',
];

const SETTLEMENTS = new Set<string>(['city', 'town', 'village', 'hamlet', 'suburb']);

/** Smaller places are labelled "near <town>" when a city or town lies within this radius. */
export const NEAR_RADIUS_M = 50_000;
/** Same name and type this close together is one place mapped twice (node + area). */
export const DUPLICATE_RADIUS_M = 2_000;

/** Alternative names that users may type (bilingual Finland, Sámi, English exonyms). */
const ALIAS_KEYS = [
  'name:sv',
  'name:nb',
  'name:no',
  'name:nn',
  'name:da',
  'name:fi',
  'name:en',
  'name:se',
];

export type Place = {
  id: string;
  name: string;
  aliases: string[];
  type: PlaceType;
  lat: number;
  lon: number;
  country: string;
  population: number;
};

export function classifyPlace(tags: OsmTags): PlaceType | null {
  if (!tags.name?.trim()) return null;
  if (tags.boundary === 'national_park') return 'national_park';
  const place = tags.place;
  if (place && SETTLEMENTS.has(place)) return place as PlaceType;
  // Islands: only notable ones (Finland alone has tens of thousands of named islets).
  if ((place === 'island' || place === 'archipelago') && tags.wikidata) return place;
  return null;
}

export function placeAliases(tags: OsmTags, name: string): string[] {
  const seen = new Set([name.trim().toLowerCase()]);
  const out: string[] = [];
  const add = (value: string | undefined) => {
    const v = value?.trim();
    if (!v || seen.has(v.toLowerCase())) return;
    seen.add(v.toLowerCase());
    out.push(v);
  };
  for (const key of ALIAS_KEYS) add(tags[key]);
  for (const alt of (tags.alt_name ?? '').split(';')) add(alt);
  return out;
}

function parsePopulation(value: string | undefined): number {
  const n = Number.parseInt((value ?? '').replace(/[\s,.]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

export type PlaceStats = {
  /** counts[type][country] */
  counts: Record<PlaceType, Record<string, number>>;
  total: number;
  duplicatesRemoved: number;
};

export function buildPlaces(features: Iterable<InputFeature>): {
  places: Place[];
  stats: PlaceStats;
} {
  const candidates: Place[] = [];
  for (const feature of uniqueFeatures(features)) {
    const type = classifyPlace(feature.tags);
    if (!type) continue;
    const point = centroid(feature.geometry);
    if (!point) continue;
    const name = feature.tags.name!.trim();
    candidates.push({
      id: feature.id,
      name,
      aliases: placeAliases(feature.tags, name),
      type,
      lat: round5(point[0]),
      lon: round5(point[1]),
      country: feature.country,
      population: parsePopulation(feature.tags.population),
    });
  }

  // Prefer the better-described duplicate (population, more aliases).
  candidates.sort((a, b) => b.population - a.population || b.aliases.length - a.aliases.length);
  const grid = new GridIndex<Place>(DUPLICATE_RADIUS_M);
  const places: Place[] = [];
  let duplicatesRemoved = 0;
  for (const place of candidates) {
    const twin = grid
      .near(place.lat, place.lon)
      .some((other) => other.type === place.type && other.name === place.name);
    if (twin) {
      duplicatesRemoved++;
      continue;
    }
    grid.add(place);
    places.push(place);
  }

  // Stable output order: by type, then name.
  places.sort(
    (a, b) =>
      PLACE_TYPES.indexOf(a.type) - PLACE_TYPES.indexOf(b.type) ||
      a.name.localeCompare(b.name, 'sv') ||
      a.id.localeCompare(b.id),
  );

  const counts = Object.fromEntries(PLACE_TYPES.map((t) => [t, {}])) as PlaceStats['counts'];
  for (const p of places) counts[p.type][p.country] = (counts[p.type][p.country] ?? 0) + 1;
  return { places, stats: { counts, total: places.length, duplicatesRemoved } };
}

/**
 * For each place, the index of the nearest city/town within NEAR_RADIUS_M (shown as
 * "near Östersund"), or -1 for cities, towns and remote places.
 */
export function nearestTowns(places: Place[]): number[] {
  const towns = new GridIndex<{ lat: number; lon: number; index: number }>(NEAR_RADIUS_M);
  places.forEach((p, index) => {
    if (p.type === 'city' || p.type === 'town') towns.add({ lat: p.lat, lon: p.lon, index });
  });
  return places.map((p) => {
    if (p.type === 'city' || p.type === 'town') return -1;
    let best = -1;
    let bestDistance = Infinity;
    for (const town of towns.near(p.lat, p.lon)) {
      const d = haversine(p.lat, p.lon, town.lat, town.lon);
      if (d < bestDistance) {
        bestDistance = d;
        best = town.index;
      }
    }
    return best;
  });
}

export const PLACE_COUNTRIES: Record<string, string> = {
  sweden: 'SE',
  norway: 'NO',
  finland: 'FI',
  denmark: 'DK',
};

export function buildPlacesOutput(
  places: Place[],
  version: string,
): { file: PlaceFile; json: string; gzip: Buffer } {
  const countries = [...new Set(places.map((p) => PLACE_COUNTRIES[p.country] ?? p.country))].sort();
  const near = nearestTowns(places);
  const tuples = places.map((p, i): PlaceTuple => {
    const base: [string, number, number, number, number, number, number] = [
      p.name,
      p.lat,
      p.lon,
      PLACE_TYPES.indexOf(p.type),
      countries.indexOf(PLACE_COUNTRIES[p.country] ?? p.country),
      near[i]!,
      p.population,
    ];
    return p.aliases.length ? [...base, p.aliases] : base;
  });
  const file: PlaceFile = {
    schema: 1,
    version,
    attribution: '© OpenStreetMap contributors',
    license: 'ODbL-1.0',
    types: [...PLACE_TYPES],
    countries,
    places: tuples,
  };
  const json = JSON.stringify(file);
  return { file, json, gzip: gzipSync(json, { level: 9 }) };
}
