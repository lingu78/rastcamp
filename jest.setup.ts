// Deterministic locale for tests; individual tests can change language via i18n.changeLanguage.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'sv', languageTag: 'sv-SE' }],
}));
