export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  collectCoverageFrom: [
    'src/**/*.js'
  ],
  verbose: true,
  testMatch: [
    '**/test/**/*.js',
    '**/__tests__/**/*.js'
  ]
};
