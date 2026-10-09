import * as Location from 'expo-location';
import { AppState, Linking } from 'react-native';

import { createStore, useStore } from './store';

export type LatLon = { lat: number; lon: number };
export type Permission = 'undetermined' | 'granted' | 'denied';

export type LocationState = {
  permission: Permission;
  /** Last known device position; null until we have a fix (or permission is denied). */
  position: LatLon | null;
};

/** Centre of SE/NO/FI/DK – where the map starts without a position (spec F4). */
export const SCANDINAVIA_CENTER: LatLon = { lat: 63.0, lon: 17.0 };
export const SCANDINAVIA_ZOOM = 3.6;

export const locationStore = createStore<LocationState>({
  permission: 'undetermined',
  position: null,
});

/** Current map centre; the list sorts on this when there is no device position (spec F4). */
export const mapCenterStore = createStore<LatLon>(SCANDINAVIA_CENTER);

let subscription: Location.LocationSubscription | null = null;

function toLatLon(location: Location.LocationObject): LatLon {
  return { lat: location.coords.latitude, lon: location.coords.longitude };
}

async function startWatching(): Promise<void> {
  if (subscription) return;
  try {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 });
    if (last) locationStore.set((s) => ({ ...s, position: toLatLon(last) }));
    subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 10_000 },
      (location) => locationStore.set((s) => ({ ...s, position: toLatLon(location) })),
      () => undefined, // Errors (e.g. location services off) just leave the last position.
    );
  } catch {
    // Location services disabled or unavailable – the app keeps working without a position.
  }
}

function stopWatching(): void {
  subscription?.remove();
  subscription = null;
}

/** Asks for permission (once) and starts watching the position if granted. Never throws. */
export async function initLocation(): Promise<void> {
  try {
    let response = await Location.getForegroundPermissionsAsync();
    if (response.status === 'undetermined' && response.canAskAgain) {
      response = await Location.requestForegroundPermissionsAsync();
    }
    const permission: Permission = response.granted
      ? 'granted'
      : response.status === 'undetermined'
        ? 'undetermined'
        : 'denied';
    locationStore.set((s) => ({
      ...s,
      permission,
      position: permission === 'granted' ? s.position : null,
    }));
    if (permission === 'granted') await startWatching();
    else stopWatching();
  } catch {
    locationStore.set((s) => ({ ...s, permission: 'denied' }));
  }
}

/**
 * For the "centre on me" button: asks again if possible, otherwise sends the user to the
 * system settings. Resolves to whether permission is granted afterwards.
 */
export async function requestLocationFromUser(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) {
      await initLocation();
      return true;
    }
    if (current.canAskAgain) {
      await Location.requestForegroundPermissionsAsync();
      await initLocation();
      return locationStore.get().permission === 'granted';
    }
    await Linking.openSettings();
    return false;
  } catch {
    return false;
  }
}

// Re-check when the app returns from the background (the user may have changed settings).
AppState.addEventListener('change', (state) => {
  if (state === 'active') void initLocation();
  else if (state === 'background') stopWatching();
});

export function useLocationState(): LocationState {
  return useStore(locationStore);
}

export function useMapCenter(): LatLon {
  return useStore(mapCenterStore);
}

/** Point used for distances: device position if known, else the map centre. */
export function useReferencePoint(): LatLon & { source: 'gps' | 'map' } {
  const { position } = useLocationState();
  const center = useMapCenter();
  return position ? { ...position, source: 'gps' } : { ...center, source: 'map' };
}
