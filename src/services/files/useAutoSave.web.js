// Web has no device storage, so there is nothing to save before an upload or download
export const useAutoSaveNow = () => ({autoSaveNow: async () => ({hasFailed: false, hasSaved: false})});

const useAutoSave = () => {};

export default useAutoSave;
