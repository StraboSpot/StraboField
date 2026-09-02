import {createSlice} from '@reduxjs/toolkit';

import {LATITUDE, LONGITUDE, MAP_MODES, ZOOM} from './maps.constants';

const initialMapsState = {
  center: [LONGITUDE, LATITUDE || [0, 0]],
  currentBasemap: null,
  currentImageBasemap: undefined,
  customMaps: {},
  drawGeometries: {
    point: MAP_MODES.DRAW.POINT,
    line: MAP_MODES.DRAW.LINE,
    polygon: MAP_MODES.DRAW.POLYGON,
  },
  featureTypesOff: [],
  freehandFeatureCoords: undefined,
  freehandVertexSpacing: {
    unit: 'pixels', // 'pixels' | 'distance'
    pixelSpacing: 20, // screen points between kept vertices
    distanceSpacing: 50, // meters between kept vertices
  },
  geometryTypesOff: [],
  intervalDragChangedSpotIds: [],
  intervalDragSnapshot: null,
  intervalDragState: null,
  isDragIntervalMode: false,
  labelTypeOn: 'dipOrName',
  isMapExtentFilterActive: false,
  isScaleBarMetric: true,
  isShowOnly1stMeas: false,
  isShowSamplesOn: false,
  mapSymbols: [],
  selectedCustomMapToEdit: {},
  spotsInMapExtentIds: [],
  stratSection: undefined,
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
    addedIntervalDragChangedSpotIds(state, action) {
      state.intervalDragChangedSpotIds = [...new Set([...state.intervalDragChangedSpotIds, ...action.payload])];
    },
    canceledIntervalDrag(state) {
      state.isDragIntervalMode = false;
      state.intervalDragState = null;
      state.intervalDragSnapshot = null;
      state.intervalDragChangedSpotIds = [];
    },
    clearedIntervalDragState(state) {
      state.intervalDragState = null;
    },
    clearedMaps(state) {
      state.customMaps = {};
    },
    clearedSpotsInMapExtentIds(state) {
      state.spotsInMapExtentIds = [];
    },
    clearedStratSection(state) {
      state.intervalDragState = null;
      state.isDragIntervalMode = false;
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
    savedIntervalDragReordering(state) {
      state.isDragIntervalMode = false;
      state.intervalDragState = null;
      state.intervalDragSnapshot = null;
      state.intervalDragChangedSpotIds = [];
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
      state.intervalDragState = null;
      state.isDragIntervalMode = false;
      state.stratSection = undefined;
      state.currentImageBasemap = action.payload;
    },
    setDrawGeometries(state, action) {
      state.drawGeometries = {...state.drawGeometries, ...action.payload};
    },
    setFeatureTypesOff(state, action) {
      // console.log('Map Feature Types Off', action.payload);
      state.featureTypesOff = action.payload;
    },
    setFreehandFeatureCoords(state, action) {
      state.freehandFeatureCoords = action.payload;
    },
    setFreehandVertexSpacing(state, action) {
      state.freehandVertexSpacing = {...state.freehandVertexSpacing, ...action.payload};
    },
    setGeometryTypesOff(state, action) {
      console.log('Map Geometry Types Off', action.payload);
      state.geometryTypesOff = action.payload;
    },
    setIntervalDragState(state, action) {
      state.intervalDragState = action.payload;
    },
    setIntervalDragTargetSlot(state, action) {
      if (state.intervalDragState) {
        state.intervalDragState.targetSlotIndex = action.payload;
        const slot = state.intervalDragState.slotMap[action.payload];
        if (slot) {
          state.intervalDragState.snapLngLat = slot.lngLat;
          state.intervalDragState.snapScreenY = slot.screenY;
        }
      }
    },
    setIsMapExtentFilterActive(state, action) {
      state.isMapExtentFilterActive = action.payload;
    },
    setIsShowOnly1stMeas(state, action) {
      state.isShowOnly1stMeas = action.payload;
    },
    setIsScaleBarMetric(state, action) {
      state.isScaleBarMetric = action.payload;
    },
    setIsShowSamplesOn(state, action) {
      state.isShowSamplesOn = action.payload;
    },
    setLabelTypeOn(state, action) {
      state.labelTypeOn = action.payload;
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
      state.intervalDragState = null;
      state.isDragIntervalMode = false;
      state.stratSection = action.payload;
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
    startedIntervalDrag(state, action) {
      state.isDragIntervalMode = true;
      state.intervalDragSnapshot = action.payload;
      state.intervalDragChangedSpotIds = [];
    },
    updateCustomMap(state, action) {
      state.customMaps[action.payload.id] = action.payload;
    },
  },
});

export const {
  addedCustomMap,
  addedCustomMapsFromBackup,
  addedIntervalDragChangedSpotIds,
  canceledIntervalDrag,
  clearedIntervalDragState,
  clearedMaps,
  clearedSpotsInMapExtentIds,
  clearedStratSection,
  clearedVertexes,
  deletedCustomMap,
  resetMapState,
  savedIntervalDragReordering,
  selectedCustomMapToEdit,
  setCenter,
  setCurrentBasemap,
  setCurrentImageBasemap,
  setDrawGeometries,
  setFeatureTypesOff,
  setFreehandFeatureCoords,
  setFreehandVertexSpacing,
  setGeometryTypesOff,
  setIntervalDragState,
  setIntervalDragTargetSlot,
  setIsMapExtentFilterActive,
  setIsScaleBarMetric,
  setIsShowOnly1stMeas,
  setIsShowSamplesOn,
  setLabelTypeOn,
  setMapSymbols,
  setSpotsInMapExtentIds,
  setStratSection,
  setTagTypeForColor,
  setVertexEndCoords,
  setVertexStartCoords,
  setZoom,
  startedIntervalDrag,
  updateCustomMap,
} = mapsSlice.actions;

export default mapsSlice.reducer;
