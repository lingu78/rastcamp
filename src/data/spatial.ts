import { around } from 'geokdbush';
import KDBush from 'kdbush';

import type { Category } from './schema';
import type { Poi } from './pois';

export type SpatialIndex = { index: KDBush; pois: Poi[] };

export function buildSpatialIndex(pois: Poi[]): SpatialIndex {
  // KDBush needs at least one point; an empty dataset gets a dummy that `nearest` never reads.
  const index = new KDBush(Math.max(pois.length, 1));
  if (pois.length === 0) index.add(0, 0);
  for (const poi of pois) index.add(poi.lon, poi.lat);
  index.finish();
  return { index, pois };
}

/** Up to `limit` POIs of the given categories, nearest first (geodesic distance). */
export function nearest(
  { index, pois }: SpatialIndex,
  lat: number,
  lon: number,
  categories: readonly Category[],
  limit = 100,
): Poi[] {
  if (pois.length === 0) return [];
  const allowed = new Set(categories);
  const ids = around(index, lon, lat, limit, Infinity, (id) => allowed.has(pois[id]!.cat));
  return ids.map((id) => pois[id]!);
}
