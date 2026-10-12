// Deterministic locale for tests; individual tests can change language via i18n.changeLanguage.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'sv', languageTag: 'sv-SE' }],
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@maplibre/maplibre-react-native', () => require('./test/maplibreMock'));

// Location is denied by default in tests (exercises the "no permission" path of spec F4).
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3, High: 4 },
  getForegroundPermissionsAsync: jest.fn(async () => ({
    status: 'denied',
    granted: false,
    canAskAgain: false,
  })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    status: 'denied',
    granted: false,
    canAskAgain: false,
  })),
  getLastKnownPositionAsync: jest.fn(async () => null),
  watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
}));

// Native file/crypto/network side of the data update (F9). The update logic itself is
// unit-tested with injected fakes in src/data/__tests__/update.test.ts.
jest.mock('./src/data/storage', () => ({
  loadStoredFile: jest.fn(async () => null),
  runUpdateCheck: jest.fn(async () => ({ status: 'skipped' })),
  getLastCheck: jest.fn(async () => null),
}));

// The bundled place names (several MB) are replaced by a small fixture in tests.
jest.mock('./assets/data/places.json', () => require('./test/placesFixture').testPlaceFile, {
  virtual: true,
});
