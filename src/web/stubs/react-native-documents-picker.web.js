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

// A picked file is already a local blob URL in the browser, so there is nothing to copy anywhere.
export const keepLocalCopy = ({files = []} = {}) => Promise.resolve(
  files.map(({uri}) => ({status: 'success', localUri: uri})),
);

export const pick = (options = {}) => new Promise((resolve, reject) => {
  const acceptedTypes = [].concat(options.type || []);
  const input = document.createElement('input');
  input.type = 'file';
  if (acceptedTypes.length > 0) input.accept = acceptedTypes.join(',');

  input.onchange = () => {
    const file = input.files && input.files[0];
    if (file) resolve([{name: file.name, size: file.size, type: file.type, uri: URL.createObjectURL(file)}]);
    else reject({code: errorCodes.OPERATION_CANCELED});
  };
  // Dismissing the file chooser fires cancel, not change — without this the promise would never settle and
  // useSafeDocumentPicker would stay stuck with isPicking true, blocking every later pick.
  input.oncancel = () => reject({code: errorCodes.OPERATION_CANCELED});

  input.click();
});
