import { fireEvent, render, screen, within } from '@testing-library/react-native';

import NearbyScreen from '@/app/(tabs)/nearby';
import { PoiDataProvider } from '@/data/DataProvider';
import type { PoiFile } from '@/data/schema';
import i18n from '@/i18n';
import { filterStore } from '@/state/filters';
import { locationStore, mapCenterStore } from '@/state/location';

import { testPoiFile } from '../../test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, navigate: jest.fn() }) }));

async function renderList(file: PoiFile = testPoiFile) {
  await render(
    <PoiDataProvider file={file}>
      <NearbyScreen />
    </PoiDataProvider>,
  );
}

const rowLabels = () =>
  screen
    .getAllByRole('button')
    .map((b) => b.props.accessibilityLabel as string)
    .filter((l) => l.includes(' km '));

describe('Närmast list (F5, F11)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('sv');
    filterStore.set([]);
    locationStore.set({ permission: 'granted', position: { lat: 59.33, lon: 18.06 } }); // Stockholm
    mockPush.mockClear();
  });

  it('sorts by distance from the device position with name, category, km and direction', async () => {
    await renderList();
    expect(screen.getByText('Avstånd från din position')).toBeOnTheScreen();
    const labels = rowLabels();
    expect(labels[0]).toBe('Tömning, Tömning, < 0,1 km åt N');
    expect(labels[1]).toMatch(/^Vattenpost, Vatten, 1,2 km åt /);
    expect(labels.at(-1)).toMatch(/^Bobilparkering Sentrum, Ställplats, 41\d km åt V$/);
  });

  it('falls back to the map centre when location is denied (F4)', async () => {
    locationStore.set({ permission: 'denied', position: null });
    mapCenterStore.set({ lat: 59.9, lon: 10.75 }); // Oslo
    await renderList();
    expect(
      screen.getByText('Avstånd från kartans mittpunkt – platstjänster är avstängda'),
    ).toBeOnTheScreen();
    expect(rowLabels()[0]).toMatch(/^Bobilparkering Sentrum, Ställplats, 1,1 km/);
  });

  it('applies the category filter', async () => {
    await renderList();
    await fireEvent.press(screen.getByRole('button', { name: 'Gasol' }));
    expect(rowLabels()).toEqual([expect.stringMatching(/^Gasolbutiken, Gasol, /)]);
  });

  it('searches by name (diacritic-insensitive) and opens the detail view', async () => {
    await renderList();
    await fireEvent.changeText(screen.getByLabelText('Sök på namn'), 'gasolbut');
    const labels = rowLabels();
    expect(labels).toHaveLength(1);
    await fireEvent.press(screen.getByLabelText(labels[0]!));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/place/[key]', params: { key: 'n6/lpg' } });

    await fireEvent.changeText(screen.getByLabelText('Sök på namn'), 'finns inte');
    expect(screen.getByText('Inga platser matchar.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Rensa sökningen' }));
    expect(rowLabels().length).toBeGreaterThan(1);
  });

  it('shows the row content visually', async () => {
    await renderList();
    const row = screen.getByLabelText(/^Gasolbutiken/);
    expect(within(row).getByText('Gasolbutiken')).toBeOnTheScreen();
    expect(within(row).getByText('Gasol')).toBeOnTheScreen();
  });
});
