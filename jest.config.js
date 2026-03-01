/** @type {import('jest').Config} */
module.exports = {
  // Engine tests are pure TypeScript — use ts-jest directly, no React Native env needed
  testEnvironment: 'node',
  testMatch: ['**/src/engine/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Relaxed settings for tests — paths are resolved by moduleNameMapper
        strict: true,
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
