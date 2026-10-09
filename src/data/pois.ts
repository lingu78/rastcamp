import { CATEGORIES, type Category, type PoiFile, type PoiTags } from './schema';

export type Poi = {
  /** Unique key: `${osmId}/${category}` (one OSM object can yield several POIs). */
  key: string;
  osmId: string;
  cat: Category;
  lat: number;
  lon: number;
  /** Empty string when OSM has no name – show the category name instead. */
  name: string;
  tags: PoiTags;
};

export type PoiDataset = {
  version: string;
  dataTimestamp: string;
  pois: Poi[];
  byKey: Map<string, Poi>;
};

export function decodePoiFile(file: PoiFile): PoiDataset {
  const pois: Poi[] = new Array(file.pois.length);
  const byKey = new Map<string, Poi>();
  file.pois.forEach((tuple, i) => {
    const [osmId, catIndex, lat, lon, name, tags] = tuple;
    const cat = CATEGORIES[catIndex] as Category;
    const poi: Poi = { key: `${osmId}/${cat}`, osmId, cat, lat, lon, name, tags: tags ?? {} };
    pois[i] = poi;
    byKey.set(poi.key, poi);
  });
  return { version: file.version, dataTimestamp: file.dataTimestamp, pois, byKey };
}
