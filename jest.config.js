module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/test/**/*.test.(ts|js)'],
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/server.ts",
    "/src/config/passport.ts",
    "/src/config/secrets.ts"
  ]
};
