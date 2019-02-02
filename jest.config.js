module.exports = {
  roots: [
    '<rootDir>/src',
  ],
  transform: {
    '^.+\\.ts$': '<rootDir>/node_modules/ts-jest'
  },
  testRegex: '\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/**/*.ts',
  ],
}
