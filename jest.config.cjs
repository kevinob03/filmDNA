module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/unit/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setupTests.js'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/utils/statisticsCalculations.js',
    'src/components/statistics/StatisticsSummary.jsx',
  ],
}
