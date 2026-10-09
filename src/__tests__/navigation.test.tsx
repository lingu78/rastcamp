import { renderRouter, screen } from 'expo-router/testing-library';

import i18n from '@/i18n';

describe('tab navigation', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('sv');
  });

  it('shows the four tabs in Swedish (device locale in tests)', async () => {
    await renderRouter('./src/app');
    for (const label of ['Karta', 'Närmast', 'Favoriter', 'Mer']) {
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    }
  });

  it('renders the Norwegian labels when the language is nb', async () => {
    await i18n.changeLanguage('nb');
    await renderRouter('./src/app');
    for (const label of ['Kart', 'Nærmest', 'Favoritter', 'Mer']) {
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    }
  });
});
