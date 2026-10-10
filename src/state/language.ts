import { AppState } from 'react-native';

import i18n, { deviceLanguage } from '@/i18n';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n/language';

import { loadJson, saveJson } from './persist';
import { createStore, useStore } from './store';

/** Spec F10: language follows the device ("auto") or is fixed to sv/nb/en. */
export type LanguagePreference = 'auto' | AppLanguage;

const STORAGE_KEY = 'rastcamp.language.v1';
export const languagePreferenceStore = createStore<LanguagePreference>('auto');

const isPreference = (value: unknown): value is LanguagePreference =>
  value === 'auto' || (SUPPORTED_LANGUAGES as readonly unknown[]).includes(value);

export function resolvePreference(preference: LanguagePreference): AppLanguage {
  return preference === 'auto' ? deviceLanguage() : preference;
}

function apply(preference: LanguagePreference): void {
  const language = resolvePreference(preference);
  if (i18n.language !== language) void i18n.changeLanguage(language);
}

export async function restoreLanguage(): Promise<void> {
  const saved = await loadJson(STORAGE_KEY, isPreference);
  if (saved) languagePreferenceStore.set(saved);
  apply(languagePreferenceStore.get());
}

export function setLanguagePreference(preference: LanguagePreference): void {
  languagePreferenceStore.set(preference);
  void saveJson(STORAGE_KEY, preference);
  apply(preference);
}

// "Auto" follows changes to the device/per-app language made while the app was in the background.
AppState.addEventListener('change', (state) => {
  if (state === 'active') apply(languagePreferenceStore.get());
});

export function useLanguagePreference(): LanguagePreference {
  return useStore(languagePreferenceStore);
}
