import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MapScreen from '@/app/(tabs)/index';
import { PoiDataProvider } from '@/data/DataProvider';
import i18n from '@/i18n';
import { filterStore } from '@/state/filters';

import { testPoiFile } from '../../test/fixtures';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
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
    await i18n.changeLanguage('sv');
  });

  it('renders one clustered source per category and the attribution', async () => {
    await renderMap();
    for (const c of ['caravan_site', 'camp_site', 'dump_station', 'water', 'rest_area', 'lpg']) {
      expect(screen.getByTestId(`pois-${c}`)).toBeOnTheScreen();
      expect(visibility(`poi-${c}`)).toBe('visible');
    }
    expect(screen.getByText('© OpenMapTiles · © OpenStreetMap contributors')).toBeOnTheScreen();
  });

  it('filter chips toggle layer visibility immediately', async () => {
    await renderMap();
    await fireEvent.press(screen.getByRole('button', { name: 'Tömning' }));
    expect(visibility('poi-dump_station')).toBe('visible');
    expect(visibility('poi-camp_site')).toBe('none');
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
});
