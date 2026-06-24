import {createSlice} from '@reduxjs/toolkit';

const initialConnectionsState = {
  databaseEndpoint: {
    endpoint: '',
    isSelected: false,
    isVerified: false,
  },
  isAutoSaving: false,
  isAutoSyncing: false,
  isLocalSaveNeeded: false,
  isOnline: {},
  isPendingImagesChanges: false,
  isProjectSyncNeeded: false,
  isTransferringImages: false,
  backupFrequency: {
    save: 60,
    sync: 0,
  },
  isWifiOnlyForImages: true,
  nextAutoSaveTime: null,
  nextAutoSyncTime: null,
  pendingUploadDatasetIds: [],
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState: initialConnectionsState,
  reducers: {
    addPendingDatasetId(state, action) {
      // Compare as strings: ids are queued from Object.keys (strings) but removed via dataset.id
      // (a number), so a strict-equality dedup/remove would mismatch and never clear the entry.
      if (!state.pendingUploadDatasetIds.some(id => String(id) === String(action.payload))) {
        state.pendingUploadDatasetIds.push(action.payload);
      }
    },
    setAutoSaving(state, action) {
      state.isAutoSaving = action.payload;
    },
    setAutoSyncing(state, action) {
      state.isAutoSyncing = action.payload;
    },
    clearAllPendingDatasetIds(state) {
      state.pendingUploadDatasetIds = [];
    },
    clearLocalSaveNeeded(state) {
      state.isLocalSaveNeeded = false;
    },
    clearProjectSyncNeeded(state) {
      state.isProjectSyncNeeded = false;
    },
    resetSyncState(state) {
      state.isLocalSaveNeeded = false;
      state.isProjectSyncNeeded = false;
      state.pendingUploadDatasetIds = [];
    },
    removePendingDatasetId(state, action) {
      // String-coerce: ids are queued from Object.keys (strings) but removed via dataset.id (number).
      state.pendingUploadDatasetIds = state.pendingUploadDatasetIds.filter(
        id => String(id) !== String(action.payload),
      );
    },
    setBackupFrequency(state, action) {
      state.backupFrequency = action.payload;
    },
    setCustomDatabaseUrl(state, action) {
      state.databaseEndpoint.endpoint = action.payload;
    },
    setDatabaseIsSelected(state, action) {
      state.databaseEndpoint.isSelected = action.payload;
    },
    setDatabaseVerify(state, action) {
      state.databaseEndpoint.isVerified = action.payload;
    },
    setPendingImagesChanges(state, action) {
      state.isPendingImagesChanges = action.payload;
    },
    setLocalSaveNeeded(state) {
      state.isLocalSaveNeeded = true;
    },
    setNextAutoSaveTime(state, action) {
      state.nextAutoSaveTime = action.payload;
    },
    setNextAutoSyncTime(state, action) {
      state.nextAutoSyncTime = action.payload;
    },
    setOnlineStatus(state, action) {
      state.isOnline = action.payload;
    },
    setProjectSyncNeeded(state) {
      state.isProjectSyncNeeded = true;
    },
    setTransferringImages(state, action) {
      state.isTransferringImages = action.payload;
    },
    setWifiOnlyForImages(state, action) {
      state.isWifiOnlyForImages = action.payload;
    },
    updatedProjectTransferProgress(state, action) {
      state.projectTransferProgress = action.payload;
    },
  },
});

export const {
  addPendingDatasetId,
  clearAllPendingDatasetIds,
  clearLocalSaveNeeded,
  clearProjectSyncNeeded,
  removePendingDatasetId,
  resetSyncState,
  setAutoSaving,
  setAutoSyncing,
  setBackupFrequency,
  setCustomDatabaseUrl,
  setDatabaseIsSelected,
  setDatabaseVerify,
  setLocalSaveNeeded,
  setNextAutoSaveTime,
  setNextAutoSyncTime,
  setOnlineStatus,
  setPendingImagesChanges,
  setProjectSyncNeeded,
  setTransferringImages,
  setWifiOnlyForImages,
  updatedProjectTransferProgress,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
