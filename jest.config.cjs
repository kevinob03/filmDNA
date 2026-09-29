module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/unit/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setupTests.js'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/modules/statistics/statisticsCalculations.js',
    'src/modules/statistics/components/StatisticsSummary.jsx',
  ],
}
