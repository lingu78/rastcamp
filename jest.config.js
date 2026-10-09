/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'app',
      preset: 'jest-expo',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/data-pipeline/'],
      transformIgnorePatterns: [
        '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@maplibre|kdbush|geokdbush|tinyqueue))',
        '/node_modules/react-native-reanimated/plugin/',
        '/node_modules/@react-native/babel-preset/',
      ],
    },
    {
      displayName: 'data-pipeline',
      testEnvironment: 'node',
      roots: ['<rootDir>/data-pipeline'],
      transform: {
        '\\.ts$': ['babel-jest', { presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]] }],
      },
      testPathIgnorePatterns: ['/node_modules/', '/work/', '/out/'],
    },
  ],
};
