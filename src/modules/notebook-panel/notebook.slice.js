import {createSlice} from '@reduxjs/toolkit';

import {isEmpty} from '../../shared/helpers';

const initialNotebookState = {
  isNotebookPanelVisible: false,
  isSamplesModalVisible: false,
  morePagesSectionsCollapsed: [],
  notebookPagesOn: ['geologic_unit', 'notes', 'orientation_data', 'images', 'tags', 'samples'],
  // notebookPagesOn: PRIMARY_PAGES.map(p => p.key),  // This worked in Native but not Web
  visibleNotebookPagesStack: [],
};

const notebookSlice = createSlice({
  name: 'notebook',
  initialState: initialNotebookState,
  reducers: {
    addedNotebookPageOn(state, action) {
      state.notebookPagesOn = [...state.notebookPagesOn, action.payload];
    },
    removedNotebookPageOn(state, action) {
      state.notebookPagesOn = state.notebookPagesOn.filter(s => s !== action.payload);
    },
    resetNotebookState() {
      return initialNotebookState;
    },
    setIsNotebookPanelVisible(state, action) {
      state.isNotebookPanelVisible = action.payload;
    },
    setMorePagesSectionsCollapsed(state, action) {
      const title = action.payload;
      if (state.morePagesSectionsCollapsed.includes(title)) {
        state.morePagesSectionsCollapsed = state.morePagesSectionsCollapsed.filter(i => i !== title);
      }
      else state.morePagesSectionsCollapsed = [...state.morePagesSectionsCollapsed, title];
    },
    setNotebookPageVisible(state, action) {
      let visibleNotebookPagesStack = state.visibleNotebookPagesStack;
      if (isEmpty(visibleNotebookPagesStack)) state.visibleNotebookPagesStack = [action.payload];
      else if (visibleNotebookPagesStack.length > 1
        && visibleNotebookPagesStack.slice(-2)[0] === action.payload) {
        state.visibleNotebookPagesStack = state.visibleNotebookPagesStack.slice(0, -1);
      }
      else if (visibleNotebookPagesStack.slice(-1)[0] !== action.payload) {
        visibleNotebookPagesStack = state.visibleNotebookPagesStack.push(action.payload);
      }
    },
    setNotebookPageVisibleToPrev(state) {
      state.visibleNotebookPagesStack = state.visibleNotebookPagesStack.slice(0, -1);
    },
  },
});

export const {
  addedNotebookPageOn,
  removedNotebookPageOn,
  resetNotebookState,
  setIsNotebookPanelVisible,
  setMorePagesSectionsCollapsed,
  setNotebookPageVisible,
  setNotebookPageVisibleToPrev,
} = notebookSlice.actions;

export default notebookSlice.reducer;
