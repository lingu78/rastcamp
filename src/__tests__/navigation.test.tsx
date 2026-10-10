import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderRouter, screen } from 'expo-router/testing-library';

import { languagePreferenceStore, setLanguagePreference } from '@/state/language';

describe('tab navigation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    languagePreferenceStore.set('auto');
  });

  it('shows the four tabs in Swedish (device locale in tests)', async () => {
    await renderRouter('./src/app');
    for (const label of ['Karta', 'Närmast', 'Favoriter', 'Mer']) {
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    }
  });

  it('renders the Norwegian labels when the user picked bokmål', async () => {
    setLanguagePreference('nb');
    await renderRouter('./src/app');
    for (const label of ['Kart', 'Nærmest', 'Favoritter', 'Mer']) {
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    }
  });
});
