module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/unit/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setupTests.js'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/unit/styleMock.js',
  },
  collectCoverageFrom: [
    'src/utils/statisticsCalculations.js',
    'src/components/statistics/StatisticsSummary.jsx',
    'src/components/admin/AdminUserForm.jsx',
    'src/components/admin/AdminAnalyticsCharts.jsx',
    'src/components/shared/AccountMenu.jsx',
    'src/components/recommendations/RecommendationChat.jsx',
  ],
}
