// Web stub for @react-native-documents/picker
// Document picking on web is handled via browser file input instead

export const errorCodes = {
  IN_PROGRESS: 'DOCUMENT_PICKER_IN_PROGRESS',
  UNABLE_TO_OPEN_FILE_TYPE: 'UNABLE_TO_OPEN_FILE_TYPE',
  OPERATION_CANCELED: 'OPERATION_CANCELED',
};

export const types = {
  json: 'application/json',
  pdf: 'application/pdf',
  plainText: 'text/plain',
  csv: 'text/csv',
  allFiles: '*/*',
};

export const isErrorWithCode = err => err && typeof err.code === 'string';

export const keepLocalCopy = () => Promise.reject({code: errorCodes.UNABLE_TO_OPEN_FILE_TYPE});

export const pick = () => Promise.reject({code: errorCodes.UNABLE_TO_OPEN_FILE_TYPE});
