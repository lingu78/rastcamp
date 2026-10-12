import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SearchScreen from '@/app/search';
import { PoiDataProvider } from '@/data/DataProvider';
import i18n from '@/i18n';
import { locationStore } from '@/state/location';
import { cameraRequestStore, searchedPlaceStore } from '@/state/searchedPlace';

import { testPoiFile } from '../../test/fixtures';

const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: jest.fn() }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderSearch() {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <PoiDataProvider file={testPoiFile}>
        <SearchScreen />
      </PoiDataProvider>
    </SafeAreaProvider>,
  );
  // The place names load right after the first frame.
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

describe('location search', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('sv');
    locationStore.set({ permission: 'granted', position: { lat: 59.33, lon: 18.06 } });
    searchedPlaceStore.set(null);
    cameraRequestStore.set(null);
    mockBack.mockClear();
    mockReplace.mockClear();
  });

  it('shows a hint before anything is typed', async () => {
    await renderSearch();
    expect(screen.getByLabelText('Sök ort eller plats')).toBeOnTheScreen();
    expect(screen.getByText(/Sök på ort, stadsdel, ö, nationalpark/)).toBeOnTheScreen();
  });

  it('finds a town without Nordic characters and jumps there', async () => {
    await renderSearch();
    await fireEvent.changeText(screen.getByLabelText('Sök ort eller plats'), 'ostersund');
    expect(await screen.findByText('Orter och områden')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /^Östersund, Tätort/ }));
    expect(searchedPlaceStore.get()).toMatchObject({ name: 'Östersund', type: 'town' });
    expect(cameraRequestStore.get()).toMatchObject({ lat: 63.176, lon: 14.636, zoom: 12 });
    expect(mockBack).toHaveBeenCalled();
  });

  it('describes smaller places with the nearest town and country', async () => {
    await renderSearch();
    await fireEvent.changeText(screen.getByLabelText('Sök ort eller plats'), 'odensala');
    expect(await screen.findByText('Ort · nära Östersund · Sverige')).toBeOnTheScreen();
  });

  it('shows the alternative name that matched', async () => {
    await renderSearch();
    await fireEvent.changeText(screen.getByLabelText('Sök ort eller plats'), 'helsingfors');
    expect(
      await screen.findByRole('button', { name: /^Helsinki \(Helsingfors\), Stad · Finland/ }),
    ).toBeOnTheScreen();
  });

  it("also finds the app's own places and opens their details", async () => {
    await renderSearch();
    await fireEvent.changeText(screen.getByLabelText('Sök ort eller plats'), 'gasol');
    expect(await screen.findByText('Platser i appen')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /^Gasolbutiken/ }));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/place/[key]',
      params: { key: 'n6/lpg' },
    });
    expect(cameraRequestStore.get()).toMatchObject({ lat: 59.3, lon: 18.1 });
    expect(searchedPlaceStore.get()).toBeNull();
  });

  it('says when nothing matches', async () => {
    await renderSearch();
    await fireEvent.changeText(screen.getByLabelText('Sök ort eller plats'), 'xyzzy');
    expect(await screen.findByText('Inga träffar för ”xyzzy”.')).toBeOnTheScreen();
  });

  it('offers to go back to the device position while a place is chosen', async () => {
    searchedPlaceStore.set({
      name: 'Åre',
      type: 'village',
      lat: 63.4,
      lon: 13.08,
      country: 'SE',
      near: null,
    });
    await renderSearch();
    await fireEvent.press(screen.getByRole('button', { name: 'Visa platser nära min position' }));
    expect(searchedPlaceStore.get()).toBeNull();
    expect(mockBack).toHaveBeenCalled();
  });
});
