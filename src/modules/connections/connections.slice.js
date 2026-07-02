import {createSlice} from '@reduxjs/toolkit';

const initialConnectionsState = {
  databaseEndpoint: {
    endpoint: '',
    isSelected: false,
    isVerified: false,
  },
  isAutoSaving: false,
  isLocalSaveNeeded: false,
  isOnline: {},
  isPendingImagesChanges: false,
  isProjectSyncNeeded: false,
  isTransferringImages: false,
  backupFrequency: {
    save: 60,
  },
  nextAutoSaveTime: null,
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState: initialConnectionsState,
  reducers: {
    setAutoSaving(state, action) {
      state.isAutoSaving = action.payload;
    },
    clearLocalSaveNeeded(state) {
      state.isLocalSaveNeeded = false;
    },
    clearProjectSyncNeeded(state) {
      state.isProjectSyncNeeded = false;
    },
    resetSyncState(state) {
      state.conflictedDatasetIds = [];
      state.isLocalSaveNeeded = false;
      state.isPendingImagesChanges = false;
      state.isProjectSyncNeeded = false;
      state.lastSyncedDatasetTimestamps = {};
      state.lastSyncedProjectTimestamp = null;
      state.pendingUploadDatasetIds = [];
    },
    setConflictedDatasetIds(state, action) {
      state.conflictedDatasetIds = action.payload;
    },
    setLastSyncedDatasetTimestamp(state, action) {
      const {id, timestamp} = action.payload;
      state.lastSyncedDatasetTimestamps[id] = timestamp;
    },
    setLastSyncedDatasetTimestamps(state, action) {
      // Merge, not replace, so a partial update keeps the bases of datasets not in the payload.
      state.lastSyncedDatasetTimestamps = {
        ...state.lastSyncedDatasetTimestamps,
        ...action.payload,
      };
    },
    setLastSyncedProjectTimestamp(state, action) {
      state.lastSyncedProjectTimestamp = action.payload;
    },
    setManualSyncRequested(state, action) {
      state.isManualSyncRequested = action.payload;
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
    setLocalSaveNeeded(state) {
      state.isLocalSaveNeeded = true;
    },
    setNextAutoSaveTime(state, action) {
      state.nextAutoSaveTime = action.payload;
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
  clearLocalSaveNeeded,
  setAutoSaving,
  setBackupFrequency,
  setCustomDatabaseUrl,
  setDatabaseIsSelected,
  setDatabaseVerify,
  setLocalSaveNeeded,
  setNextAutoSaveTime,
  setOnlineStatus,
  setPendingImagesChanges,
  setProjectSyncNeeded,
  setTransferringImages,
  setWifiOnlyForImages,
  updatedProjectTransferProgress,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
