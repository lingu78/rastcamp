import { classify, type OsmTags } from './categorize.ts';
import { centroid, GridIndex, type Geometry } from './geo.ts';
import { CATEGORIES, type Category, type PoiTags } from './schema.ts';
import { pickName, pickTags } from './tags.ts';

export const DEDUP_RADIUS_M = 30;
export const WATER_NEAR_DUMP_RADIUS_M = 50;

export type InputFeature = {
  /** "n123" | "w123" | "r123", or osmium's area id "a246" (normalised by uniqueFeatures). */
  id: string;
  tags: OsmTags;
  geometry: Geometry;
  country: string;
};

export type Poi = {
  id: string;
  cat: Category;
  lat: number;
  lon: number;
  name: string;
  tags: PoiTags;
  country: string;
};

export type BuildStats = {
  /** counts[category][country] */
  counts: Record<Category, Record<string, number>>;
  totals: Record<Category, number>;
  total: number;
  duplicatesRemoved: number;
  drinkingWaterNearDump: number;
};

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

/**
 * osmium's `--add-unique-id=type_id` yields n/w/r ids for nodes and linestrings, and
 * "a<id>" for areas: way id × 2 for closed ways, relation id × 2 + 1 for multipolygons.
 */
export function normalizeOsmId(id: string): string | null {
  const match = /^([nwra])(\d+)$/.exec(id);
  if (!match) return null;
  const [, type, digits] = match as unknown as [string, string, string];
  if (type !== 'a') return `${type}${digits}`;
  const n = BigInt(digits);
  return n % 2n === 0n ? `w${n / 2n}` : `r${(n - 1n) / 2n}`;
}

const GEOMETRY_RANK: Record<InputFeature['geometry']['type'], number> = {
  Polygon: 3,
  MultiPolygon: 3,
  Point: 2,
  LineString: 1,
};

/**
 * One feature per OSM object: closed ways come out of osmium both as a linestring and
 * as an area, and border objects appear in two country extracts. Prefer the area.
 */
export function uniqueFeatures(features: Iterable<InputFeature>): InputFeature[] {
  const byId = new Map<string, InputFeature>();
  for (const feature of features) {
    const id = normalizeOsmId(feature.id);
    if (!id) continue;
    const existing = byId.get(id);
    if (!existing || GEOMETRY_RANK[feature.geometry.type] > GEOMETRY_RANK[existing.geometry.type]) {
      byId.set(id, existing ? { ...feature, id, country: existing.country } : { ...feature, id });
    }
  }
  return [...byId.values()];
}

function score(poi: Poi): number {
  return (poi.name ? 10 : 0) + Object.keys(poi.tags).length + (poi.id.startsWith('n') ? 0 : 1);
}

/**
 * Removes POIs of the same category within `radius` metres of a better one
 * (named > more tags > area over node), merging missing name/tags into the survivor.
 */
export function dedupe(pois: Poi[], radius = DEDUP_RADIUS_M): { kept: Poi[]; removed: number } {
  const byCategory = new Map<Category, Poi[]>();
  for (const poi of pois) {
    const list = byCategory.get(poi.cat);
    if (list) list.push(poi);
    else byCategory.set(poi.cat, [poi]);
  }

  const kept: Poi[] = [];
  let removed = 0;
  for (const list of byCategory.values()) {
    const ordered = [...list].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
    const index = new GridIndex<Poi>(radius);
    for (const poi of ordered) {
      const survivor = index.near(poi.lat, poi.lon)[0];
      if (survivor) {
        removed++;
        if (!survivor.name && poi.name) survivor.name = poi.name;
        survivor.tags = { ...poi.tags, ...survivor.tags };
        continue;
      }
      const copy = { ...poi, tags: { ...poi.tags } };
      index.add(copy);
      kept.push(copy);
    }
  }
  return { kept, removed };
}

export function emptyCounts(): Record<Category, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
}

/** Turns raw OSM features into the final, deduplicated POI list. */
export function buildPois(features: Iterable<InputFeature>): { pois: Poi[]; stats: BuildStats } {
  const candidates: Poi[] = [];
  const drinkingWater: Poi[] = [];

  for (const feature of uniqueFeatures(features)) {
    const { categories, drinkingWaterCandidate } = classify(feature.tags);
    if (categories.length === 0 && !drinkingWaterCandidate) continue;

    const point = centroid(feature.geometry);
    if (!point) continue;

    const base = {
      id: feature.id,
      lat: round5(point[0]),
      lon: round5(point[1]),
      name: pickName(feature.tags),
      tags: pickTags(feature.tags),
      country: feature.country,
    };
    for (const cat of categories) candidates.push({ ...base, cat });
    if (drinkingWaterCandidate) drinkingWater.push({ ...base, cat: 'water' });
  }

  // amenity=drinking_water only counts when it is next to a dump station (spec §5.2).
  const dumps = new GridIndex<Poi>(WATER_NEAR_DUMP_RADIUS_M);
  for (const poi of candidates) if (poi.cat === 'dump_station') dumps.add(poi);
  let drinkingWaterNearDump = 0;
  for (const poi of drinkingWater) {
    if (dumps.near(poi.lat, poi.lon).length > 0) {
      candidates.push(poi);
      drinkingWaterNearDump++;
    }
  }

  const { kept, removed } = dedupe(candidates);
  kept.sort(
    (a, b) =>
      CATEGORIES.indexOf(a.cat) - CATEGORIES.indexOf(b.cat) ||
      a.lat - b.lat ||
      a.lon - b.lon ||
      a.id.localeCompare(b.id),
  );

  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, {}])) as BuildStats['counts'];
  const totals = emptyCounts();
  for (const poi of kept) {
    counts[poi.cat][poi.country] = (counts[poi.cat][poi.country] ?? 0) + 1;
    totals[poi.cat]++;
  }

  return {
    pois: kept,
    stats: {
      counts,
      totals,
      total: kept.length,
      duplicatesRemoved: removed,
      drinkingWaterNearDump,
    },
  };
}

/** Categories with zero POIs – the build must fail if this is non-empty (spec §5.3). */
export function emptyCategories(totals: Record<Category, number>): Category[] {
  return CATEGORIES.filter((c) => totals[c] === 0);
}
