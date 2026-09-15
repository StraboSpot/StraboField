// Web stub for react-native-fs
// File system operations are not available on web

const noop = () => Promise.resolve();
const noopFalse = () => Promise.resolve(false);
const noopNull = () => Promise.resolve(null);
const noopEmpty = () => Promise.resolve('');
const noopArray = () => Promise.resolve([]);

const RNFS = {
  // Path constants (empty strings so directory concatenation doesn't crash)
  DocumentDirectoryPath: '',
  DownloadDirectoryPath: '',
  CachesDirectoryPath: '',
  ExternalDirectoryPath: '',
  ExternalStorageDirectoryPath: '',
  LibraryDirectoryPath: '',
  MainBundlePath: '',
  TemporaryDirectoryPath: '',

  // File type constants
  RNFSFileTypeRegular: 0,
  RNFSFileTypeDirectory: 1,

  // Methods
  mkdir: noop,
  moveFile: noop,
  copyFile: noop,
  unlink: noop,
  writeFile: noop,
  appendFile: noop,
  exists: noopFalse,
  // Reads the blob: and data: URIs the web document picker hands back. Device paths do not exist on web, so
  // anything else keeps returning an empty string rather than failing a fetch against a path that is not a URL.
  readFile: async (source) => {
    if (typeof source === 'string' && (source.startsWith('blob:') || source.startsWith('data:'))) {
      const response = await fetch(source);
      return response.text();
    }
    return noopEmpty();
  },
  readdir: noopArray,
  stat: noopNull,
  getFSInfo: () => Promise.resolve({freeSpace: 0, totalSpace: 0}),
  downloadFile: () => ({promise: Promise.resolve({statusCode: 0, bytesWritten: 0})}),
  stopDownload: noop,
  uploadFiles: () => ({promise: Promise.resolve({statusCode: 0})}),
  touch: noop,
  scanFile: noopNull,
  getAllExternalFilesDirs: noopArray,
};

export default RNFS;
