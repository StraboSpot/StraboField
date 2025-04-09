import {createSlice} from '@reduxjs/toolkit';

import {LATITUDE, LONGITUDE, ZOOM} from './maps.constants';

const initialMapsState = {
  center: [LONGITUDE, LATITUDE || [0,0]],
  currentBasemap: null,
  currentImageBasemap: undefined,
  customMaps: {},
  freehandFeatureCoords: undefined,
  isMapMoved: true,
  isShowOnly1stMeas: false,
  isShowSpotLabelsOn: true,
  mapSymbols: [],
  selectedCustomMapToEdit: {},
  spotsInMapExtentIds: [],
  stratSection: undefined,
  symbolsOn: [],
  tagTypeForColor: undefined,
  vertexEndCoords: undefined,
  vertexStartCoords: undefined,
  zoom: ZOOM,
};

const mapsSlice = createSlice({
  name: 'map',
  initialState: initialMapsState,
  reducers: {
    addedCustomMap(state, action) {
      const newMapObject = Object.assign({}, {[action.payload.id]: action.payload});
      // console.log('Setting custom maps: ', newMapObject);
      state.customMaps = {...state.customMaps, ...newMapObject};
    },
    addedCustomMapsFromBackup(state, action) {
      state.customMaps = action.payload;
    },
    clearedMaps(state) {
      state.customMaps = {};
    },
    clearedSpotsInMapExtentIds(state) {
      state.spotsInMapExtentIds = [];
    },
    clearedStratSection(state) {
      state.stratSection = undefined;
    },
    clearedVertexes(state) {
      state.vertexStartCoords = undefined;
      state.vertexEndCoords = undefined;
    },
    deletedCustomMap(state, action) {
      state.customMaps = action.payload;
    },
    resetMapState() {
      return initialMapsState;
    },
    selectedCustomMapToEdit(state, action) {
      state.selectedCustomMapToEdit = action.payload;
    },
    setCenter(state, action) {
      state.center = action.payload;
    },
    setCurrentBasemap(state, action) {
      // const newBasemap = BASEMAPS.find(basemap => basemap.id === action.payload);
      // console.log('Setting current basemap to a default basemap...');
      state.currentBasemap = action.payload;
    },
    setCurrentImageBasemap(state, action) {
      state.stratSection = undefined;
      state.currentImageBasemap = action.payload;
    },
    setFreehandFeatureCoords(state, action) {
      state.freehandFeatureCoords = action.payload;
    },
    setIsMapMoved(state, action) {
      state.isMapMoved = action.payload;
    },
    setIsShowOnly1stMeas(state, action) {
      state.isShowOnly1stMeas = action.payload;
    },
    setIsShowSpotLabelsOn(state, action) {
      state.isShowSpotLabelsOn = action.payload;
    },
    setMapSymbols(state, action) {
      // console.log('Set Map Symbols', action.payload);
      state.mapSymbols = action.payload;
    },
    setSpotsInMapExtentIds(state, action) {
      state.spotsInMapExtentIds = action.payload;
    },
    setStratSection(state, action) {
      state.currentImageBasemap = undefined;
      state.stratSection = action.payload;
    },
    setSymbolsDisplayed(state, action) {
      // console.log('Map Symbols Displayed', action.payload);
      state.symbolsOn = action.payload;
    },
    setTagTypeForColor(state, action) {
      state.tagTypeForColor = action.payload;
    },
    setVertexEndCoords(state, action) {
      // console.log('Set vertex selected end coords: ', action.payload);
      state.vertexEndCoords = action.payload;
    },
    setVertexStartCoords(state, action) {
      // console.log('Set vertex selected start coords: ', action.payload);
      state.vertexStartCoords = action.payload;
    },
    setZoom(state, action) {
      state.zoom = action.payload;
    },
    updateCustomMap(state, action) {
      state.customMaps[action.payload.id] = action.payload;
    },
  },
});

export const {
  addedCustomMap,
  addedCustomMapsFromBackup,
  clearedMaps,
  clearedSpotsInMapExtentIds,
  clearedStratSection,
  clearedVertexes,
  deletedCustomMap,
  resetMapState,
  selectedCustomMapToEdit,
  setCenter,
  setCurrentBasemap,
  setCurrentImageBasemap,
  setFreehandFeatureCoords,
  setIsMapMoved: setIsMapMoved,
  setIsShowOnly1stMeas,
  setIsShowSpotLabelsOn,
  setMapSymbols,
  setSpotsInMapExtentIds,
  setStratSection,
  setSymbolsDisplayed,
  setTagTypeForColor,
  setVertexEndCoords,
  setVertexStartCoords,
  setZoom,
  updateCustomMap,
} = mapsSlice.actions;

export default mapsSlice.reducer;


