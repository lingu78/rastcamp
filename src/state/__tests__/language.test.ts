import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '@/i18n';

import {
  languagePreferenceStore,
  resolvePreference,
  restoreLanguage,
  setLanguagePreference,
} from '../language';

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('language preference (F10)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    languagePreferenceStore.set('auto');
    await i18n.changeLanguage('sv');
  });

  it('"auto" follows the device language (sv in tests)', () => {
    expect(resolvePreference('auto')).toBe('sv');
    expect(resolvePreference('en')).toBe('en');
  });

  it('switches the UI language immediately and remembers the choice', async () => {
    setLanguagePreference('nb');
    await flush();
    expect(i18n.language).toBe('nb');
    expect(i18n.t('tabs.nearby')).toBe('Nærmest');

    languagePreferenceStore.set('auto');
    await i18n.changeLanguage('sv');
    await restoreLanguage();
    expect(languagePreferenceStore.get()).toBe('nb');
    expect(i18n.language).toBe('nb');
  });

  it('back to auto restores the device language', async () => {
    setLanguagePreference('en');
    setLanguagePreference('auto');
    await flush();
    expect(i18n.language).toBe('sv');
  });
});
