import {createSlice} from '@reduxjs/toolkit';

const initialConnectionsState = {
  databaseEndpoint: {
    endpoint: '',
    isSelected: false,
    isVerified: false,
  },
  isAutoSaving: false,
  isAutoUploading: false,
  isLocalSaveNeeded: false,
  isOnline: {},
  isProjectDirty: false,
  backupFrequency: {
    save: 30,
    upload: 30,
  },
  nextAutoSaveTime: null,
  nextAutoUploadTime: null,
  pendingUploadDatasetIds: [],
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState: initialConnectionsState,
  reducers: {
    addPendingDatasetId(state, action) {
      if (!state.pendingUploadDatasetIds.includes(action.payload)) {
        state.pendingUploadDatasetIds.push(action.payload);
      }
    },
    setAutoSaving(state, action) {
      state.isAutoSaving = action.payload;
    },
    setAutoUploading(state, action) {
      state.isAutoUploading = action.payload;
    },
    clearAllPendingDatasetIds(state) {
      state.pendingUploadDatasetIds = [];
    },
    clearLocalSaveNeeded(state) {
      state.isLocalSaveNeeded = false;
    },
    clearProjectDirty(state) {
      state.isProjectDirty = false;
    },
    resetSyncState(state) {
      state.isLocalSaveNeeded = false;
      state.isProjectDirty = false;
      state.pendingUploadDatasetIds = [];
    },
    removePendingDatasetId(state, action) {
      state.pendingUploadDatasetIds = state.pendingUploadDatasetIds.filter(
        id => id !== action.payload,
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
    setNextAutoUploadTime(state, action) {
      state.nextAutoUploadTime = action.payload;
    },
    setOnlineStatus(state, action) {
      state.isOnline = action.payload;
    },
    setProjectDirty(state) {
      state.isProjectDirty = true;
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
  clearProjectDirty,
  removePendingDatasetId,
  resetSyncState,
  setAutoSaving,
  setAutoUploading,
  setBackupFrequency,
  setCustomDatabaseUrl,
  setDatabaseIsSelected,
  setDatabaseVerify,
  setLocalSaveNeeded,
  setNextAutoSaveTime,
  setNextAutoUploadTime,
  setOnlineStatus,
  setProjectDirty,
  updatedProjectTransferProgress,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
