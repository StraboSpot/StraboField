import {createSlice} from '@reduxjs/toolkit';

import {isEmpty} from '../../../shared/helpers';

const initialOfflineMapsState = {
  offlineMaps: {},
};

const offlineMapsSlice = createSlice({
  name: 'offlineMaps',
  initialState: initialOfflineMapsState,
  reducers: {
    addedMapsFromDevice(state, action) {
      const {mapType, maps} = action.payload;
      state[mapType] = maps;
    },
    addMapFromDevice(state, action) {
      state.offlineMaps = {...state.offlineMaps, ...action.payload};
    },
    clearedMapsFromRedux(state) {
      state.offlineMaps = initialOfflineMapsState.offlineMaps;
    },
    deletedOfflineMap(state, action) {
      delete state.offlineMaps[action.payload];
    },
    editedOfflineMap(state, action) {
      state.offlineMaps[action.payload.id].name = action.payload.name;
    },
    resetOfflineMapsState() {
      return initialOfflineMapsState;
    },
    setOfflineMap(state, action) {
      console.log('Setting offline maps: ', action.payload);
      if (isEmpty(action.payload)) state.offlineMaps = initialOfflineMapsState.offlineMaps;
      else state.offlineMaps[action.payload.id] = action.payload;
    },
    setOfflineMapVisible(state, action) {
      const {mapId, viewable} = action.payload;
      const toggleFalse = Object.values(state.offlineMaps).map((offlineMap) => {
        offlineMap.isOfflineMapVisible = false;
        return offlineMap;
      });
      console.log(toggleFalse);
      state.offlineMaps[mapId] = {...state.offlineMaps[mapId], isOfflineMapVisible: viewable};
    },
  },
});

export const {
  addMapFromDevice,
  addedMapsFromDevice,
  clearedMapsFromRedux,
  deletedOfflineMap,
  editedOfflineMap,
  resetOfflineMapsState,
  setOfflineMap,
  setOfflineMapVisible,
} = offlineMapsSlice.actions;

export default offlineMapsSlice.reducer;
