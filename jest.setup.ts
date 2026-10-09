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
  Accuracy: { Balanced: 3 },
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
