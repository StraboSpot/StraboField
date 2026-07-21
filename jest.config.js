module.exports = {
  preset: 'react-native',
  // Stub native modules that are pulled in transitively by shared constants but not under test.
  moduleNameMapper: {
    '^react-native-fs$': '<rootDir>/jest/mocks/react-native-fs.js',
    '^react-native-get-random-values$': '<rootDir>/jest/mocks/empty.js',
  },
  // Transform ESM-only libraries (default RN preset ignores all of node_modules except RN packages).
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|uuid)/)',
  ],
};
