import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MapScreen from '@/app/(tabs)/index';
import { PoiDataProvider } from '@/data/DataProvider';
import i18n from '@/i18n';
import { filterStore } from '@/state/filters';
import { locationStore } from '@/state/location';
import { requestCamera, searchedPlaceStore } from '@/state/searchedPlace';

import { cameraCalls } from '../../test/maplibreMock';
import { testPoiFile } from '../../test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: jest.fn() }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderMap() {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <PoiDataProvider file={testPoiFile}>
        <MapScreen />
      </PoiDataProvider>
    </SafeAreaProvider>,
  );
}

const visibility = (layerId: string) =>
  JSON.parse(screen.getByTestId(layerId).props.accessibilityHint as string).visibility;

describe('map screen (F1–F4)', () => {
  beforeEach(async () => {
    filterStore.set([]);
    locationStore.set({ permission: 'undetermined', position: null });
    searchedPlaceStore.set(null);
    mockPush.mockClear();
    await i18n.changeLanguage('sv');
  });

  it('renders one clustered source per category and the attribution', async () => {
    await renderMap();
    for (const c of ['caravan_site', 'camp_site', 'dump_station', 'water', 'rest_area', 'lpg']) {
      expect(screen.getByTestId(`pois-${c}`)).toBeOnTheScreen();
      expect(visibility(`poi-${c}`)).toBe('visible');
      expect(visibility(`poi-dot-${c}`)).toBe('visible');
    }
    expect(screen.getByText('© OpenMapTiles · © OpenStreetMap contributors')).toBeOnTheScreen();
  });

  it('filter chips toggle layer visibility immediately', async () => {
    await renderMap();
    await fireEvent.press(screen.getByRole('button', { name: 'Tömning' }));
    expect(visibility('poi-dump_station')).toBe('visible');
    expect(visibility('poi-camp_site')).toBe('none');
    expect(visibility('poi-dot-camp_site')).toBe('none');
    expect(visibility('cluster-camp_site')).toBe('none');
    expect(screen.getByRole('button', { name: 'Tömning' }).props.accessibilityState).toMatchObject({
      selected: true,
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Alla' }));
    expect(visibility('poi-camp_site')).toBe('visible');
  });

  it('starts over Scandinavia and offers to enable location when permission is denied', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await renderMap();
    expect(screen.queryByTestId('user-location')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Centrera på min position' }));
    expect(alert).toHaveBeenCalledWith(
      'Platstjänster är avstängda',
      expect.any(String),
      expect.any(Array),
    );
  });

  it("draws the device position from the app's own location fix", async () => {
    locationStore.set({ permission: 'granted', position: { lat: 59.91, lon: 10.75 } });
    await renderMap();
    expect(screen.getByTestId('user-location')).toBeOnTheScreen();
    expect(screen.getByTestId('user-location-dot')).toBeOnTheScreen();
  });

  it('opens the location search from the search bar', async () => {
    await renderMap();
    await fireEvent.press(screen.getByRole('search', { name: 'Sök ort eller plats' }));
    expect(mockPush).toHaveBeenCalledWith('/search');
  });

  it('shows the chosen place with a marker and lets you clear it', async () => {
    searchedPlaceStore.set({
      name: 'Åre',
      type: 'village',
      lat: 63.4,
      lon: 13.08,
      country: 'SE',
      near: null,
    });
    await renderMap();
    expect(screen.getByText('Åre')).toBeOnTheScreen();
    expect(screen.getByTestId('searched-place')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Sluta visa platser nära Åre' }));
    expect(searchedPlaceStore.get()).toBeNull();
    expect(screen.queryByTestId('searched-place')).toBeNull();
  });

  it('flies to places requested by the search', async () => {
    await renderMap();
    cameraCalls.length = 0;
    await act(() => requestCamera(63.4, 13.08, 13));
    expect(cameraCalls).toContainEqual({
      method: 'flyTo',
      args: { center: [13.08, 63.4], zoom: 13, duration: 1000 },
    });
  });
});
