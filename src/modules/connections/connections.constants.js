// Outcome of the project save the web listener middleware sends to the server, for callers that can't
// use its toasts — a modal is painted over the toast layer, so toasts shown from one are never visible.
export const PROJECT_SAVE_STATUS = {
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
};
