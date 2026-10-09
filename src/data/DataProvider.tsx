import { createContext, use, useMemo, type ReactNode } from 'react';

import { featureCollectionsByCategory, type PoiFeatureCollection } from './geojson';
import { decodePoiFile, type PoiDataset } from './pois';
import { validatePoiFile, type Category, type PoiFile } from './schema';
import { buildSpatialIndex, type SpatialIndex } from './spatial';

export type PoiData = PoiDataset & {
  spatial: SpatialIndex;
  geojson: Record<Category, PoiFeatureCollection>;
};

const EMPTY_FILE: PoiFile = {
  schema: 1,
  version: '',
  dataTimestamp: '',
  generated: '',
  attribution: '',
  license: '',
  categories: [],
  pois: [],
};

/** The POI file shipped inside the app (refreshed before every release). */
function loadBundledFile(): PoiFile {
  try {
    // require (not import) so TypeScript doesn't try to type a multi-MB JSON literal.
    const data: unknown = require('../../assets/data/pois.json');
    return validatePoiFile(data) ? data : EMPTY_FILE;
  } catch {
    return EMPTY_FILE;
  }
}

export function buildPoiData(file: PoiFile): PoiData {
  const dataset = decodePoiFile(file);
  return {
    ...dataset,
    spatial: buildSpatialIndex(dataset.pois),
    geojson: featureCollectionsByCategory(dataset.pois),
  };
}

const PoiDataContext = createContext<PoiData | null>(null);

export function PoiDataProvider({ children, file }: { children: ReactNode; file?: PoiFile }) {
  const data = useMemo(() => buildPoiData(file ?? loadBundledFile()), [file]);
  return <PoiDataContext value={data}>{children}</PoiDataContext>;
}

export function usePoiData(): PoiData {
  const data = use(PoiDataContext);
  if (!data) throw new Error('usePoiData must be used inside <PoiDataProvider>');
  return data;
}
