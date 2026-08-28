import {createSlice} from '@reduxjs/toolkit';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';

const initialCompassState = {
  isClassicCompass: true,
  isCompassEnlarged: false,
  measurements: {},
  measurementTypes: [COMPASS_TOGGLE_BUTTONS.PLANAR],
};

// createSlice combines reducers, actions, and constants
const compassSlice = createSlice({
  name: 'compass',
  initialState: initialCompassState,
  reducers: {
    resetCompassState() {
      return initialCompassState;
    },
    setIsClassicCompass(state, action) {
      state.isClassicCompass = action.payload;
    },
    setIsCompassEnlarged(state, action) {
      state.isCompassEnlarged = action.payload;
    },
    setCompassMeasurements(state, action) {
      state.measurements = action.payload;
    },
    setCompassMeasurementTypes(state, action) {
      state.measurementTypes = action.payload;
    },
  },
});

export const {
  resetCompassState,
  setCompassMeasurements,
  setCompassMeasurementTypes,
  setIsClassicCompass,
  setIsCompassEnlarged,
} = compassSlice.actions;

export default compassSlice.reducer;
