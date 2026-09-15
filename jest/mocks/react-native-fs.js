// Minimal stub for the react-native-fs native module. It is pulled in transitively by
// directories.constants.js (via glyphs/maps constants); tests here exercise pure logic and never
// touch the filesystem, so the real Flow-typed native module only needs to be a no-op shape.
module.exports = {
  DocumentDirectoryPath: '/mock/Documents',
  ExternalDirectoryPath: '/mock/External',
  MainBundlePath: '/mock/MainBundle',
  TemporaryDirectoryPath: '/mock/tmp',
  copyFile: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(false)),
  mkdir: jest.fn(() => Promise.resolve()),
  readDir: jest.fn(() => Promise.resolve([])),
  readFile: jest.fn(() => Promise.resolve('')),
  unlink: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
};
