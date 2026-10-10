import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import nb from './locales/nb.json';
import sv from './locales/sv.json';
import { SUPPORTED_LANGUAGES, resolveLanguage, type AppLanguage } from './language';

export const resources = {
  sv: { translation: sv },
  nb: { translation: nb },
  en: { translation: en },
} as const;

/** Language the device asks for, mapped onto the languages we ship. */
export function deviceLanguage(): AppLanguage {
  try {
    return resolveLanguage(getLocales());
  } catch {
    return 'en';
  }
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

export default i18n;
