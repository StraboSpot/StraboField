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
  isProjectConflicted: false,
  isProjectSyncNeeded: false,
  isTransferringImages: false,
  backupFrequency: {
    save: 60,
    sync: 0,
  },
  isWifiOnlyForImages: true,
  conflictedDatasetIds: [],
  isManualSyncRequested: false,
  lastSyncedDatasetTimestamps: {},
  lastSyncedProjectTimestamp: null,
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
    addConflictedDatasetId(state, action) {
      if (!state.conflictedDatasetIds.some(id => String(id) === String(action.payload))) {
        state.conflictedDatasetIds.push(action.payload);
      }
    },
    clearConflictedDatasetId(state, action) {
      // String-coerce: ids may be queued as strings (Object.keys) or numbers (dataset.id).
      state.conflictedDatasetIds = state.conflictedDatasetIds.filter(
        id => String(id) !== String(action.payload),
      );
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
      state.isProjectConflicted = false;
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
    setProjectConflicted(state, action) {
      state.isProjectConflicted = action.payload;
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
  addConflictedDatasetId,
  addPendingDatasetId,
  clearAllPendingDatasetIds,
  clearConflictedDatasetId,
  clearLocalSaveNeeded,
  clearProjectSyncNeeded,
  removePendingDatasetId,
  resetSyncState,
  setAutoSaving,
  setAutoSyncing,
  setBackupFrequency,
  setConflictedDatasetIds,
  setCustomDatabaseUrl,
  setDatabaseIsSelected,
  setDatabaseVerify,
  setLastSyncedDatasetTimestamp,
  setLastSyncedDatasetTimestamps,
  setLastSyncedProjectTimestamp,
  setLocalSaveNeeded,
  setManualSyncRequested,
  setNextAutoSaveTime,
  setNextAutoSyncTime,
  setOnlineStatus,
  setPendingImagesChanges,
  setProjectConflicted,
  setProjectSyncNeeded,
  setTransferringImages,
  setWifiOnlyForImages,
  updatedProjectTransferProgress,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
