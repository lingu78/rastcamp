import { CATEGORIES, type Category } from './schema';
import type { Poi } from './pois';

export type PoiFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, { i: number }>;

/**
 * One FeatureCollection per category (each becomes its own clustered map source, so
 * clusters only count visible categories and filtering is just a layer visibility flip).
 * Properties are kept minimal – `i` is the index into the dataset's POI array.
 */
export function featureCollectionsByCategory(pois: Poi[]): Record<Category, PoiFeatureCollection> {
  const result = Object.fromEntries(
    CATEGORIES.map((c) => [c, { type: 'FeatureCollection', features: [] }]),
  ) as unknown as Record<Category, PoiFeatureCollection>;
  pois.forEach((poi, i) => {
    result[poi.cat].features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [poi.lon, poi.lat] },
      properties: { i },
    });
  });
  return result;
}
