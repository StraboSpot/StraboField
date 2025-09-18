import {createSlice} from '@reduxjs/toolkit';

import {SORTED_VIEWS} from '../spots/spots.constants';

const initialMainMenuState = {
  isSidePanelVisible: false,
  mainMenuPageVisible: null,
  sectionsCollapsed: [],
  selectedButtonIndex: 0,
  sidePanelView: null,
  sortedView: SORTED_VIEWS.CHRONOLOGICAL,
};

// createSlice combines reducers, actions, and constants
const mainMenuSlice = createSlice({
  name: 'mainMenu',
  initialState: initialMainMenuState,
  reducers: {
    setMenuSelectionPage(state, action) {
      state.mainMenuPageVisible = action.payload.name;
    },
    setSectionsCollapsed(state, action) {
      const title = action.payload;
      if (state.sectionsCollapsed.includes(title)) {
        state.sectionsCollapsed = state.sectionsCollapsed.filter(i => i !== title);
      }
      else state.sectionsCollapsed = [...state.sectionsCollapsed, title];
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
  setSectionsCollapsed,
  setSelectedButtonIndex,
  setSidePanelVisible,
  setSortedView,
} = mainMenuSlice.actions;

export default mainMenuSlice.reducer;


