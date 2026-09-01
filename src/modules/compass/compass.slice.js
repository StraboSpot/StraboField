import {createSlice} from '@reduxjs/toolkit';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';

const initialCompassState = {
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
} = compassSlice.actions;

export default compassSlice.reducer;
