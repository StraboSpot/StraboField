import {createSlice} from '@reduxjs/toolkit';

import {SORTED_VIEWS} from '../spots/spots.constants';

const initialMainMenuState = {
  sortedView: SORTED_VIEWS.CHRONOLOGICAL,
  selectedButtonIndex: 0,
  mainMenuPageVisible: null,
  isSidePanelVisible: false,
  sidePanelView: null,
};

// createSlice combines reducers, actions, and constants
const mainMenuSlice = createSlice({
  name: 'mainMenu',
  initialState: initialMainMenuState,
  reducers: {
    setMenuSelectionPage(state, action) {
      state.mainMenuPageVisible = action.payload.name;
    },
    setSelectedButtonIndex(state, action) {
      state.selectedButtonIndex = action.payload.index;
    },
    setSidePanelVisible(state, action) {
      if (action.payload.hasOwnProperty('bool')) state.isSidePanelVisible = action.payload.bool;
      if (action.payload.hasOwnProperty('view')) state.sidePanelView = action.payload.view;
      if (action.payload.hasOwnProperty('tag')) state.tag = action.payload.tag;
    },
    setSortedView(state, action) {
      state.sortedView = action.payload.view;
    },
  },
});

export const {
  setMenuSelectionPage,
  setSelectedButtonIndex,
  setSidePanelVisible,
  setSortedView,
} = mainMenuSlice.actions;

export default mainMenuSlice.reducer;


