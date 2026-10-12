/** Format of places.json, shared by the pipeline and the app (no Node imports here). */

export const PLACE_TYPES = [
  'city',
  'town',
  'village',
  'hamlet',
  'suburb',
  'island',
  'archipelago',
  'national_park',
] as const;
export type PlaceType = (typeof PLACE_TYPES)[number];

/** [name, lat, lon, typeIndex, countryIndex, nearIndex (-1 = none), population (0 = unknown), aliases?] */
export type PlaceTuple =
  | [string, number, number, number, number, number, number]
  | [string, number, number, number, number, number, number, string[]];

export type PlaceFile = {
  schema: 1;
  version: string;
  attribution: string;
  license: string;
  types: PlaceType[];
  /** ISO 3166-1 alpha-2 codes, e.g. "SE". */
  countries: string[];
  places: PlaceTuple[];
};
