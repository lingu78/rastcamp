import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { featureCollectionsByCategory, type PoiFeatureCollection } from './geojson';
import { decodePoiFile, type PoiDataset } from './pois';
import { validatePoiFile, type Category, type PoiFile } from './schema';
import { buildSearchIndex } from './search';
import { buildSpatialIndex, type SpatialIndex } from './spatial';
import { loadStoredFile, runUpdateCheck } from './storage';
import { markPerf } from '../utils/perf';
import type { UpdateResult } from './update';
import { isNewer } from './update';

export type PoiData = PoiDataset & {
  spatial: SpatialIndex;
  geojson: Record<Category, PoiFeatureCollection>;
  /** Normalised names, same order as `pois` (spec F11). */
  searchIndex: string[];
};

export type DataSource = 'bundled' | 'downloaded';

export type DataStatus = {
  source: DataSource;
  /** Result of the last update check in this session, if any. */
  lastResult: UpdateResult | null;
  checking: boolean;
  /** Manually triggered check ("Sök efter ny data" in Mer). */
  checkNow: () => Promise<UpdateResult>;
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
    searchIndex: buildSearchIndex(dataset.pois),
  };
}

/** Delay the background update check so it never competes with start-up. */
const UPDATE_DELAY_MS = 4000;

const PoiDataContext = createContext<PoiData | null>(null);
const DataStatusContext = createContext<DataStatus | null>(null);

type Props = {
  children: ReactNode;
  /** Fixed data for tests; disables stored data and update checks. */
  file?: PoiFile;
};

export function PoiDataProvider({ children, file: fixedFile }: Props) {
  const [file, setFile] = useState<PoiFile>(() => fixedFile ?? loadBundledFile());
  const [source, setSource] = useState<DataSource>('bundled');
  const [lastResult, setLastResult] = useState<UpdateResult | null>(null);
  const [checking, setChecking] = useState(false);
  const versionRef = useRef(file.version);

  const adopt = useCallback((next: PoiFile, from: DataSource) => {
    if (!isNewer(next.version, versionRef.current)) return;
    versionRef.current = next.version;
    setFile(next);
    setSource(from);
  }, []);

  const runCheck = useCallback(
    async (force: boolean): Promise<UpdateResult> => {
      setChecking(true);
      try {
        const result = await runUpdateCheck(versionRef.current, force);
        setLastResult(result);
        if (result.status === 'updated') adopt(result.file, 'downloaded');
        return result;
      } finally {
        setChecking(false);
      }
    },
    [adopt],
  );

  useEffect(() => {
    if (fixedFile) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      const stored = await loadStoredFile();
      if (cancelled) return;
      if (stored) adopt(stored, 'downloaded');
      timer = setTimeout(() => void runCheck(false), UPDATE_DELAY_MS);
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fixedFile, adopt, runCheck]);

  const data = useMemo(() => {
    const built = buildPoiData(file);
    markPerf('data-ready');
    return built;
  }, [file]);
  const status = useMemo<DataStatus>(
    () => ({ source, lastResult, checking, checkNow: () => runCheck(true) }),
    [source, lastResult, checking, runCheck],
  );

  return (
    <PoiDataContext value={data}>
      <DataStatusContext value={status}>{children}</DataStatusContext>
    </PoiDataContext>
  );
}

export function usePoiData(): PoiData {
  const data = use(PoiDataContext);
  if (!data) throw new Error('usePoiData must be used inside <PoiDataProvider>');
  return data;
}

export function useDataStatus(): DataStatus {
  const status = use(DataStatusContext);
  if (!status) throw new Error('useDataStatus must be used inside <PoiDataProvider>');
  return status;
}
