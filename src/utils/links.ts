import { Linking, Platform } from 'react-native';

import type { Poi } from '@/data/pois';

const coord = (n: number) => n.toFixed(6);

/**
 * "Navigera dit" (spec F6): Apple Maps on iOS, a geo: intent on Android (opens Google Maps
 * or the user's chosen map app). Rastcamp never does routing itself.
 */
export function navigationUrl(
  poi: Poi,
  label: string,
  os: typeof Platform.OS = Platform.OS,
): string {
  const lat = coord(poi.lat);
  const lon = coord(poi.lon);
  if (os === 'ios') {
    return `https://maps.apple.com/?daddr=${lat},${lon}&q=${encodeURIComponent(label)}&dirflg=d`;
  }
  return `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(label)})`;
}

const webDirectionsUrl = (poi: Poi) =>
  `https://www.google.com/maps/dir/?api=1&destination=${coord(poi.lat)},${coord(poi.lon)}`;

export async function openNavigation(poi: Poi, label: string): Promise<void> {
  try {
    await Linking.openURL(navigationUrl(poi, label));
  } catch {
    await Linking.openURL(webDirectionsUrl(poi)).catch(() => undefined);
  }
}

/** "Rapportera fel": a new OpenStreetMap note at the place, in the browser. */
export function reportUrl(poi: Poi): string {
  const lat = coord(poi.lat);
  const lon = coord(poi.lon);
  return `https://www.openstreetmap.org/note/new?lat=${lat}&lon=${lon}#map=18/${lat}/${lon}`;
}

/** Link to the OSM object itself (used when sharing). */
export function osmUrl(poi: Poi): string {
  const types: Record<string, string> = { n: 'node', w: 'way', r: 'relation' };
  const type = types[poi.osmId[0] ?? ''] ?? 'node';
  return `https://www.openstreetmap.org/${type}/${poi.osmId.slice(1)}`;
}

export function mapLinkUrl(poi: Poi): string {
  const lat = coord(poi.lat);
  const lon = coord(poi.lon);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
}
