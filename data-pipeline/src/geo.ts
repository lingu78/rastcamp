const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

type Position = [number, number]; // GeoJSON order: [lon, lat]
export type Geometry =
  | { type: 'Point'; coordinates: Position }
  | { type: 'LineString'; coordinates: Position[] }
  | { type: 'Polygon'; coordinates: Position[][] }
  | { type: 'MultiPolygon'; coordinates: Position[][][] };

function average(points: Position[]): Position | null {
  if (points.length === 0) return null;
  let lon = 0;
  let lat = 0;
  for (const [x, y] of points) {
    lon += x;
    lat += y;
  }
  return [lon / points.length, lat / points.length];
}

/** Area-weighted centroid of a ring (planar; fine for campsite-sized areas). */
function ringCentroid(ring: Position[]): { centroid: Position | null; area: number } {
  let area2 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i]!;
    const [x1, y1] = ring[i + 1]!;
    const cross = x0 * y1 - x1 * y0;
    area2 += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (Math.abs(area2) < 1e-14) return { centroid: average(ring), area: 0 };
  return { centroid: [cx / (3 * area2), cy / (3 * area2)], area: Math.abs(area2 / 2) };
}

/** Reduces any supported geometry to one point, returned as [lat, lon]. */
export function centroid(geometry: Geometry): [number, number] | null {
  let point: Position | null = null;
  switch (geometry.type) {
    case 'Point':
      point = geometry.coordinates;
      break;
    case 'LineString':
      point = average(geometry.coordinates);
      break;
    case 'Polygon':
      point = geometry.coordinates[0] ? ringCentroid(geometry.coordinates[0]).centroid : null;
      break;
    case 'MultiPolygon': {
      let best: { centroid: Position | null; area: number } = { centroid: null, area: -1 };
      for (const polygon of geometry.coordinates) {
        if (!polygon[0]) continue;
        const candidate = ringCentroid(polygon[0]);
        if (candidate.area > best.area) best = candidate;
      }
      point = best.centroid;
      break;
    }
  }
  if (!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;
  return [point[1], point[0]];
}

/**
 * Uniform lat/lon grid for "anything within R metres?" queries. Cells are at least R
 * wide everywhere up to 82°N (covers Svalbard), so checking the 3×3 neighbourhood is exact.
 */
export class GridIndex<T extends { lat: number; lon: number }> {
  private readonly cellLat: number;
  private readonly cellLon: number;
  private readonly cells = new Map<string, T[]>();
  readonly radius: number;

  constructor(radiusMeters: number) {
    this.radius = radiusMeters;
    this.cellLat = radiusMeters / 111_000;
    this.cellLon = radiusMeters / (111_000 * Math.cos(toRad(82)));
  }

  private key(i: number, j: number) {
    return `${i}:${j}`;
  }

  add(item: T): void {
    const k = this.key(Math.floor(item.lat / this.cellLat), Math.floor(item.lon / this.cellLon));
    const list = this.cells.get(k);
    if (list) list.push(item);
    else this.cells.set(k, [item]);
  }

  /** Items within `radius` metres of the point. */
  near(lat: number, lon: number): T[] {
    const i0 = Math.floor(lat / this.cellLat);
    const j0 = Math.floor(lon / this.cellLon);
    const result: T[] = [];
    for (let i = i0 - 1; i <= i0 + 1; i++) {
      for (let j = j0 - 1; j <= j0 + 1; j++) {
        for (const item of this.cells.get(this.key(i, j)) ?? []) {
          if (haversine(lat, lon, item.lat, item.lon) <= this.radius) result.push(item);
        }
      }
    }
    return result;
  }
}
