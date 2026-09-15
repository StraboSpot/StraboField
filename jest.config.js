module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest/setup.js'],
  // Stub native modules that are pulled in transitively by shared constants but not under test.
  moduleNameMapper: {
    '^react-native-fs$': '<rootDir>/jest/mocks/react-native-fs.js',
    '^react-native-get-random-values$': '<rootDir>/jest/mocks/empty.js',
    // Binary assets require()'d by source (not handled by the RN image transform).
    '\\.(pdf|mp3|wav|m4a|ttf|otf)$': '<rootDir>/jest/mocks/empty.js',
  },
  // The app pulls in many ESM-only libraries transitively; transform all of
  // node_modules so no `import`/`export` slips through un-compiled. Native
  // modules that throw at import are stubbed in jest/setup.js instead.
  transformIgnorePatterns: [],
};
