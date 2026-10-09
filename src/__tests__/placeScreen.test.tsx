import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking, Platform, Share } from 'react-native';

import PlaceScreen from '@/app/place/[key]';
import { PoiDataProvider } from '@/data/DataProvider';
import i18n from '@/i18n';
import { favoritesStore, restoreFavorites } from '@/state/favorites';
import { locationStore } from '@/state/location';

import { testPoiFile } from '../../test/fixtures';

let mockParams: { key: string } = { key: 'w2/camp_site' };
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

async function renderPlace(key: string) {
  mockParams = { key };
  await render(
    <PoiDataProvider file={testPoiFile}>
      <PlaceScreen />
    </PoiDataProvider>,
  );
}

describe('detail view (F6, F8)', () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

  beforeEach(async () => {
    await i18n.changeLanguage('sv');
    favoritesStore.set([]);
    await AsyncStorage.clear();
    locationStore.set({ permission: 'granted', position: { lat: 59.91, lon: 10.75 } });
    openURL.mockClear();
  });

  it('shows name, category, distance and only the fields that have data', async () => {
    await renderPlace('w2/camp_site');
    expect(screen.getByRole('header', { name: 'Fjordcamping' })).toBeOnTheScreen();
    expect(screen.getByText('Camping · 5,2 km NO')).toBeOnTheScreen();
    expect(screen.getByText('Dusch')).toBeOnTheScreen();
    expect(screen.getByText('Toalett')).toBeOnTheScreen();
    expect(screen.getByText('example.no')).toBeOnTheScreen();
    expect(screen.queryByText('El')).toBeNull();
    expect(screen.queryByText('Avgift')).toBeNull();
    expect(screen.getByText('59.95000, 10.80000')).toBeOnTheScreen();
  });

  it('uses the category as title when the place has no name', async () => {
    await renderPlace('n3/dump_station');
    expect(screen.getByRole('header', { name: 'Tömning' })).toBeOnTheScreen();
    expect(screen.getByText('Tömning gråvatten')).toBeOnTheScreen();
  });

  it('"Navigera dit" hands over to the platform map app', async () => {
    await renderPlace('n1/caravan_site');
    await fireEvent.press(screen.getByRole('button', { name: 'Navigera dit' }));
    const url = openURL.mock.calls[0]?.[0] as string;
    if (Platform.OS === 'ios')
      expect(url).toMatch(/^https:\/\/maps\.apple\.com\/\?daddr=59\.910000,10\.750000/);
    else expect(url).toMatch(/^geo:59\.910000,10\.750000\?q=/);
  });

  it('"Rapportera fel" opens an OSM note in the browser', async () => {
    await renderPlace('n1/caravan_site');
    await fireEvent.press(screen.getByRole('link', { name: 'Rapportera fel' }));
    expect(openURL).toHaveBeenCalledWith(
      'https://www.openstreetmap.org/note/new?lat=59.910000&lon=10.750000#map=18/59.910000/10.750000',
    );
  });

  it('shares the place', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    await renderPlace('n6/lpg');
    await fireEvent.press(screen.getByRole('button', { name: 'Dela' }));
    expect(share.mock.calls[0]?.[0]).toMatchObject({
      message: expect.stringContaining('Gasolbutiken (Gasol)'),
    });
  });

  it('saves and removes a favourite that survives a restart', async () => {
    await renderPlace('n1/caravan_site');
    await fireEvent.press(screen.getByRole('button', { name: 'Spara favorit' }));
    expect(screen.getByRole('button', { name: 'Ta bort favorit' })).toBeOnTheScreen();
    await act(async () => {
      await new Promise((r) => setImmediate(r));
      favoritesStore.set([]); // simulate a cold start
      await restoreFavorites();
    });
    expect(favoritesStore.get().map((f) => f.key)).toEqual(['n1/caravan_site']);
  });

  it('calls the phone number and closes', async () => {
    const withPhone = {
      ...testPoiFile,
      pois: [['n9', 0, 60, 15, 'Ring', { phone: '+46 8 12 34' }]] as typeof testPoiFile.pois,
    };
    mockParams = { key: 'n9/caravan_site' };
    await render(
      <PoiDataProvider file={withPhone}>
        <PlaceScreen />
      </PoiDataProvider>,
    );
    await fireEvent.press(screen.getByRole('link', { name: 'Ring +46 8 12 34' }));
    expect(openURL).toHaveBeenCalledWith('tel:+4681234');
    await fireEvent.press(screen.getByRole('button', { name: 'Stäng' }));
    expect(mockBack).toHaveBeenCalled();
  });
});
