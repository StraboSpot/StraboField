import {createSlice} from '@reduxjs/toolkit';

const initialConnectionsState = {
  databaseEndpoint: {
    endpoint: '',
    isSelected: false,
    isVerified: false,
  },
  isLocalSaveNeeded: false,
  isOnline: {},
  isProjectDirty: false,
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
    clearAllPendingDatasetIds(state) {
      state.pendingUploadDatasetIds = [];
    },
    clearLocalSaveNeeded(state) {
      state.isLocalSaveNeeded = false;
    },
    clearProjectDirty(state) {
      state.isProjectDirty = false;
    },
    removePendingDatasetId(state, action) {
      state.pendingUploadDatasetIds = state.pendingUploadDatasetIds.filter(
        id => id !== action.payload,
      );
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
  setCustomDatabaseUrl,
  setDatabaseIsSelected,
  setDatabaseVerify,
  setLocalSaveNeeded,
  setOnlineStatus,
  setProjectDirty,
  updatedProjectTransferProgress,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
