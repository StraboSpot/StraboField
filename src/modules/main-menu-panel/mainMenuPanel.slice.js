import {createSlice} from '@reduxjs/toolkit';

const initialMainMenuState = {
  isSidePanelVisible: false,
  listFilters: {}, // keyed by page (spots/images/samples/tags/geologic_units) so each list filters independently
  mainMenuPageVisible: null,
  sectionsCollapsed: [],
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
    setListFilters(state, action) {
      state.listFilters[action.payload.page] = action.payload.value;
    },
    setSectionsCollapsed(state, action) {
      const title = action.payload;
      if (state.sectionsCollapsed.includes(title)) {
        state.sectionsCollapsed = state.sectionsCollapsed.filter(i => i !== title);
      }
      else state.sectionsCollapsed = [...state.sectionsCollapsed, title];
    },
    setSidePanelVisible(state, action) {
      if (action.payload.hasOwnProperty('bool')) state.isSidePanelVisible = action.payload.bool;
      if (action.payload.hasOwnProperty('view')) state.sidePanelView = action.payload.view;
      if (action.payload.hasOwnProperty('tag')) state.tag = action.payload.tag;
    },
  },
});

export const {
  setListFilters,
  setMenuSelectionPage,
  setSectionsCollapsed,
  setSidePanelVisible,
} = mainMenuSlice.actions;

export default mainMenuSlice.reducer;


