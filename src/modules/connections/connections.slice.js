import {createSlice} from '@reduxjs/toolkit';

import {getNewUUID} from '../../shared/helpers';

const initialConnectionsState = {
  databaseEndpoint: {
    endpoint: '',
    isSelected: false,
    isVerified: false,
  },
  // Identifies this install to the server (the X-Strabo-Device header). Persisted and never reset, so it outlives
  // signing out; the one minted here only sticks on an install's first launch, since rehydration replaces it after.
  deviceId: getNewUUID(),
  isAutoSaving: false,
  isForceOffline: false,
  isLocalSaveNeeded: false,
  isOnline: {},
  isProfileUploadNeeded: false,
  backupFrequency: {
    save: 60,
  },
  nextAutoSaveTime: null,
  projectSaveStatus: null,
  // When Spots were last uploaded, so views showing what the server has can check again
  spotsUploadedTimestamp: null,
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
    clearProfileUploadNeeded(state) {
      state.isProfileUploadNeeded = false;
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
    setForceOffline(state, action) {
      state.isForceOffline = action.payload;
    },
    setLocalSaveNeeded(state) {
      state.isLocalSaveNeeded = true;
    },
    setProfileUploadNeeded(state) {
      state.isProfileUploadNeeded = true;
    },
    setProjectSaveStatus(state, action) {
      state.projectSaveStatus = action.payload;
    },
    setSpotsUploadedTimestamp(state, action) {
      state.spotsUploadedTimestamp = action.payload;
    },
    setNextAutoSaveTime(state, action) {
      state.nextAutoSaveTime = action.payload;
    },
    setOnlineStatus(state, action) {
      state.isOnline = action.payload;
    },
    updatedProjectTransferProgress(state, action) {
      state.projectTransferProgress = action.payload;
    },
  },
});

export const {
  clearLocalSaveNeeded,
  clearProfileUploadNeeded,
  setAutoSaving,
  setBackupFrequency,
  setCustomDatabaseUrl,
  setDatabaseIsSelected,
  setDatabaseVerify,
  setForceOffline,
  setLocalSaveNeeded,
  setNextAutoSaveTime,
  setOnlineStatus,
  setProfileUploadNeeded,
  setProjectSaveStatus,
  setSpotsUploadedTimestamp,
  updatedProjectTransferProgress,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
