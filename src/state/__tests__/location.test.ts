import * as Location from 'expo-location';

import { initLocation, locationStore } from '../location';

describe('initLocation (F4)', () => {
  beforeEach(() => {
    locationStore.set({ permission: 'undetermined', position: null });
    jest.clearAllMocks();
  });

  it('asks only once even when called concurrently', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    });
    await Promise.all([initLocation(), initLocation(), initLocation()]);
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(locationStore.get().permission).toBe('denied');
  });

  it('starts watching when granted', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 59.9, longitude: 10.7 },
    });
    await initLocation();
    expect(locationStore.get()).toEqual({
      permission: 'granted',
      position: { lat: 59.9, lon: 10.7 },
    });
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);
  });

  it('never throws when location services fail', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockRejectedValue(new Error('boom'));
    await expect(initLocation()).resolves.toBeUndefined();
    expect(locationStore.get().permission).toBe('denied');
  });
});
