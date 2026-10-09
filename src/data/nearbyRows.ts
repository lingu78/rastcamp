import type { PoiData } from './DataProvider';
import type { Poi } from './pois';
import type { Category } from './schema';
import { searchPois } from './search';
import { nearest } from './spatial';
import { haversine } from '../utils/geo';

export const MAX_ROWS = 100;

/**
 * Rows for the "Närmast" list (spec F5): the nearest POIs of the visible categories, or –
 * with a search query (F11) – the matching POIs, nearest first. Never more than 100.
 */
export function nearbyRows(
  data: Pick<PoiData, 'pois' | 'spatial' | 'searchIndex'>,
  categories: readonly Category[],
  query: string,
  lat: number,
  lon: number,
): Poi[] {
  if (query.trim()) {
    return searchPois(data.pois, data.searchIndex, query, categories)
      .map((poi) => ({ poi, d: haversine(lat, lon, poi.lat, poi.lon) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_ROWS)
      .map((r) => r.poi);
  }
  return nearest(data.spatial, lat, lon, categories, MAX_ROWS);
}
