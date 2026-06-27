// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});
/** @type {import('jest').Config} */
const config = {
  // Add any custom Jest config here
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
module.exports = createJestConfig(config);
