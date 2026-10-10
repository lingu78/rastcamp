export const SUPPORTED_LANGUAGES = ['sv', 'nb', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Subset of expo-localization's `Locale` that we need (keeps this pure and testable). */
export type DeviceLocale = { languageCode: string | null; languageTag: string };

/**
 * Device language → app language.
 * - `no` (macro-language), `nb` and `nn` → bokmål.
 * - Danish → bokmål (written Danish and bokmål are mutually intelligible).
 * - Everything else falls through to the next preferred device locale, then English.
 */
const LANGUAGE_MAP: Record<string, AppLanguage> = {
  sv: 'sv',
  nb: 'nb',
  no: 'nb',
  nn: 'nb',
  da: 'nb',
  en: 'en',
};

export function resolveLanguage(locales: readonly DeviceLocale[]): AppLanguage {
  for (const locale of locales) {
    const code = (locale.languageCode ?? locale.languageTag.split(/[-_]/)[0] ?? '').toLowerCase();
    const match = LANGUAGE_MAP[code];
    if (match) return match;
  }
  return 'en';
}
