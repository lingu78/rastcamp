import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import LicensesScreen from '@/app/licenses';
import MoreScreen from '@/app/(tabs)/more';
import { PoiDataProvider } from '@/data/DataProvider';
import i18n from '@/i18n';
import { languagePreferenceStore } from '@/state/language';

import { testPoiFile } from '../../test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

async function renderMore() {
  await render(
    <PoiDataProvider file={testPoiFile}>
      <MoreScreen />
    </PoiDataProvider>,
  );
}

describe('Mer tab (F10)', () => {
  beforeEach(async () => {
    languagePreferenceStore.set('auto');
    await i18n.changeLanguage('sv');
  });

  it('shows data version, units, licences, privacy policy and app version', async () => {
    await renderMore();
    expect(screen.getByText('Version 2026-10-08')).toBeOnTheScreen();
    expect(screen.getByText('Inbyggd i appen')).toBeOnTheScreen();
    expect(screen.getByText('Kilometer')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Datakällor och licenser' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Appversion: /)).toBeOnTheScreen();
  });

  it('switches language from the radio list', async () => {
    await renderMore();
    expect(
      screen.getByRole('radio', { name: 'Automatiskt (enhetens språk)' }).props.accessibilityState,
    ).toEqual({
      checked: true,
    });
    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));
    expect(screen.getByRole('radio', { name: 'English' }).props.accessibilityState).toEqual({
      checked: true,
    });
    expect(screen.getByText('Data sources and licences')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Automatic (device language)' }));
    expect(screen.getByText('Datakällor och licenser')).toBeOnTheScreen();
  });

  it('opens the licences and the privacy policy', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await renderMore();
    await fireEvent.press(screen.getByRole('button', { name: 'Datakällor och licenser' }));
    expect(mockPush).toHaveBeenCalledWith('/licenses');
    await fireEvent.press(screen.getByRole('link', { name: 'Integritetspolicy' }));
    expect(openURL).toHaveBeenCalledWith('https://lingu78.github.io/rastcamp/privacy/');
  });
});

describe('licences screen', () => {
  it('contains the ODbL text and the bundled software', async () => {
    await i18n.changeLanguage('sv');
    await render(<LicensesScreen />);
    expect(screen.getByText('OpenStreetMap – platsdata / place data')).toBeOnTheScreen();
    const buttons = screen.getAllByRole('button', { name: 'Visa licenstext' });
    await fireEvent.press(buttons[0]!);
    expect(screen.getByText(/Open Database License/)).toBeOnTheScreen();
  });
});
