module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.js', '**/*.test.ts', '**/**/*.test.ts'],
  moduleNameMapper: {
    '~/(.*)$': '<rootDir>/$1',
    '@src/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 9000000,
};
