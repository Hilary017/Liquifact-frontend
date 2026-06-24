const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Playwright e2e specs live under ./tests and use @playwright/test,
  // which is not a Jest runtime. Keep them out of Jest's collection.
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '<rootDir>/tests/'],
};

module.exports = createJestConfig(customJestConfig);
