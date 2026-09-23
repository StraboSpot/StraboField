import {createSlice} from '@reduxjs/toolkit';

import {isEmpty} from '../../../shared/helpers';

const initialOfflineMapsState = {
  offlineMaps: {},
  // The one downloaded map standing in for the live basemap, or null. Held here rather than on each map
  // because only one is ever previewed, and because a map is a Mapbox style object with no room for app state.
  previewedOfflineMapId: null,
};

const offlineMapsSlice = createSlice({
  name: 'offlineMaps',
  initialState: initialOfflineMapsState,
  reducers: {
    addMapFromDevice(state, action) {
      state.offlineMaps = {...state.offlineMaps, ...action.payload};
    },
    clearedMapsFromRedux(state) {
      state.offlineMaps = initialOfflineMapsState.offlineMaps;
      state.previewedOfflineMapId = null;
    },
    // Previewing is a temporary view rather than saved state, so it is also cleared at launch
    clearedOfflineMapPreview(state) {
      state.previewedOfflineMapId = null;
    },
    deletedOfflineMap(state, action) {
      delete state.offlineMaps[action.payload];
      if (state.previewedOfflineMapId === action.payload) state.previewedOfflineMapId = null;
    },
    editedOfflineMap(state, action) {
      state.offlineMaps[action.payload.id].name = action.payload.name;
    },
    resetOfflineMapsState() {
      return initialOfflineMapsState;
    },
    setOfflineMap(state, action) {
      console.log('Setting offline maps: ', action.payload);
      if (isEmpty(action.payload)) {
        state.offlineMaps = initialOfflineMapsState.offlineMaps;
        state.previewedOfflineMapId = null;
      }
      else state.offlineMaps[action.payload.id] = action.payload;
    },
    // Replaces the lot, so a preview left pointing at a map the import did not bring back has to end
    setOfflineMapsFromImport(state, action) {
      state.offlineMaps = action.payload;
      if (!state.offlineMaps[state.previewedOfflineMapId]) state.previewedOfflineMapId = null;
    },
    // Only one map is previewed at a time, so choosing another simply replaces it
    startedOfflineMapPreview(state, action) {
      state.previewedOfflineMapId = action.payload;
    },
  },
});

export const {
  addMapFromDevice,
  clearedMapsFromRedux,
  clearedOfflineMapPreview,
  deletedOfflineMap,
  editedOfflineMap,
  resetOfflineMapsState,
  setOfflineMap,
  setOfflineMapsFromImport,
  startedOfflineMapPreview,
} = offlineMapsSlice.actions;

export default offlineMapsSlice.reducer;
