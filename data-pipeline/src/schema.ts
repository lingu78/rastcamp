/**
 * Shape of the published POI file (`pois.json(.gz)`) and its manifest.
 * Shared by the data pipeline and the app (re-exported from `src/data/schema.ts`).
 * Bump SCHEMA_VERSION on any breaking change; the app ignores files with a newer schema.
 */

export const SCHEMA_VERSION = 1;

/** Order matters: a POI stores its category as an index into this array. */
export const CATEGORIES = [
  'caravan_site',
  'camp_site',
  'dump_station',
  'water',
  'rest_area',
  'lpg',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** OSM keys kept per POI (spec F6). Everything else is dropped by the pipeline. */
export const TAG_KEYS = [
  'fee',
  'charge',
  'opening_hours',
  'phone',
  'website',
  'power_supply',
  'shower',
  'toilets',
  'drinking_water',
  'water_point',
  'sanitary_dump_station',
  'sanitary_dump_station:grey_water',
  'sanitary_dump_station:chemical_toilet',
  'sanitary_dump_station:black_water',
  'capacity',
  'capacity:caravans',
  'capacity:motorhome',
  'dog',
  'description',
  'description:sv',
  'description:nb',
  'description:en',
] as const;

export type TagKey = (typeof TAG_KEYS)[number];
export type PoiTags = Partial<Record<TagKey, string>>;

/**
 * Compact POI record: [osmId, categoryIndex, lat, lon, name, tags?]
 * osmId is "n123" / "w123" / "r123". A single OSM object can yield several POIs
 * (e.g. a campsite with a dump station), so the unique key is `${osmId}/${category}`.
 */
export type PoiTuple =
  | [id: string, cat: number, lat: number, lon: number, name: string]
  | [id: string, cat: number, lat: number, lon: number, name: string, tags: PoiTags];

export type PoiFile = {
  schema: number;
  /** Data version, e.g. "2026-10-09" (OSM data timestamp, UTC date). */
  version: string;
  /** ISO timestamp of the OSM data (oldest of the country extracts). */
  dataTimestamp: string;
  generated: string;
  attribution: string;
  license: string;
  categories: readonly Category[];
  pois: PoiTuple[];
};

export type Manifest = {
  schema: number;
  version: string;
  dataTimestamp: string;
  generated: string;
  /** File name relative to the manifest URL. */
  file: string;
  /** Size in bytes and SHA-256 (hex) of the gzip file as published. */
  bytes: number;
  sha256: string;
  /** SHA-256 (hex) of the uncompressed JSON. */
  jsonSha256: string;
  count: number;
  counts: Record<Category, number>;
  attribution: string;
  license: string;
};

export const ATTRIBUTION = '© OpenStreetMap contributors';
export const LICENSE = 'ODbL-1.0';
