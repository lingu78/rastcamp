/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'app',
      preset: 'jest-expo',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/data-pipeline/'],
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
