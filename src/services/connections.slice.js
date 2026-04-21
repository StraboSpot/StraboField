import {createSlice} from '@reduxjs/toolkit';

const initialConnectionsState = {
  databaseEndpoint: {
    endpoint: '',
    isSelected: false,
    isVerified: false,
  },
  isOnline: {},
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState: initialConnectionsState,
  reducers: {
    setCustomDatabaseUrl(state, action) {
      state.databaseEndpoint.endpoint = action.payload;
    },
    setDatabaseIsSelected(state, action) {
      state.databaseEndpoint.isSelected = action.payload;
    },
    setDatabaseVerify(state, action) {
      state.databaseEndpoint.isVerified = action.payload;
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
  setCustomDatabaseUrl,
  setDatabaseIsSelected,
  setDatabaseVerify,
  setOnlineStatus,
  updatedProjectTransferProgress,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
