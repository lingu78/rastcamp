import { PLACE_ZOOM, type Place } from '@/data/places';

import { createStore, useStore } from './store';

/**
 * A place chosen in the location search. While set, "Närmast" measures from it and the map
 * shows a marker there. Not persisted: after a restart the app starts from the device again.
 */
export type SearchedPlace = Pick<Place, 'name' | 'type' | 'lat' | 'lon' | 'country' | 'near'>;

export const searchedPlaceStore = createStore<SearchedPlace | null>(null);

export type CameraRequest = { lat: number; lon: number; zoom: number; id: number };

/** One-shot "move the map here" requests (newest wins), consumed by the map. */
export const cameraRequestStore = createStore<CameraRequest | null>(null);

let requestId = 0;

export function requestCamera(lat: number, lon: number, zoom: number): void {
  cameraRequestStore.set({ lat, lon, zoom, id: ++requestId });
}

export function selectSearchedPlace(place: SearchedPlace): void {
  searchedPlaceStore.set({
    name: place.name,
    type: place.type,
    lat: place.lat,
    lon: place.lon,
    country: place.country,
    near: place.near,
  });
  requestCamera(place.lat, place.lon, PLACE_ZOOM[place.type]);
}

export function clearSearchedPlace(): void {
  searchedPlaceStore.set(null);
}

export function useSearchedPlace(): SearchedPlace | null {
  return useStore(searchedPlaceStore);
}

export function useCameraRequest(): CameraRequest | null {
  return useStore(cameraRequestStore);
}
