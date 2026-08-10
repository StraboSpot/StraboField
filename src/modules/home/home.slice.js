import {createSlice} from '@reduxjs/toolkit';

const initialHomeState = {
  statusMessages: [],
  geolocationTimeout: 120000,
  imageProgress: {
    imagesDownloadedCount: 0,
    neededImageIds: 0,
  },
  loading: {
    modal: false,
    home: false,
  },
  modalValues: {},
  modalVisible: null,
  hiddenWarnings: {},
  isBackupModalVisible: false,
  isStatusMessagesModalVisible: false,
  isErrorMessagesModalVisible: false,
  isProgressModalVisible: false,
  isProjectLoadSelectionModalVisible: false,
  isSessionExpiredModalVisible: false,
  isOfflineMapModalVisible: false,
  isImageModalVisible: false,
  isMainMenuPanelVisible: false,
  isUploadModalVisible: false,
  isUploadProgressModalVisible: false,
  shortcutSwitchPosition: {
    all: false,
    tag: false,
    geologic_units: false,
    measurement: false,
    sample: false,
    note: false,
    photo: false,
    sketch: false,
  },
  statusMessageModalTitle: '',
};

// createSlice combines reducers, actions, and constants
const homeSlice = createSlice({
  name: 'home',
  initialState: initialHomeState,
  reducers: {
    addedStatusMessage(state, action) {
      state.statusMessages.push(action.payload);
    },
    clearedStatusMessages(state) {
      state.statusMessages = [];
    },
    removedLastStatusMessage(state) {
      state.statusMessages = state.statusMessages.slice(0, -1);
    },
    resetHiddenWarnings(state) {
      state.hiddenWarnings = {};
    },
    resetHomeState() {
      return initialHomeState;
    },
    setIsBackupModalVisible(state, action) {
      state.isBackupModalVisible = action.payload;
    },
    setIsWarningHidden(state, action) {
      const {key, isHidden} = action.payload;
      state.hiddenWarnings[key] = isHidden;
    },
    setIsErrorMessagesModalVisible(state, action) {
      state.isErrorMessagesModalVisible = action.payload;
    },
    setGeolocationTimeout(state, action) {
      state.geolocationTimeout = action.payload;
    },
    setIsMainMenuPanelVisible(state, action) {
      state.isMainMenuPanelVisible = action.payload;
    },
    setIsOfflineMapsModalVisible(state, action) {
      state.isOfflineMapModalVisible = action.payload;
    },
    setIsProgressModalVisible(state, action) {
      state.isProgressModalVisible = action.payload;
    },
    setIsProjectLoadSelectionModalVisible(state, action) {
      state.isProjectLoadSelectionModalVisible = action.payload;
    },
    setIsSessionExpiredModalVisible(state, action) {
      state.isSessionExpiredModalVisible = action.payload;
    },
    setIsStatusMessagesModalVisible(state, action) {
      state.isStatusMessagesModalVisible = action.payload;
    },
    setIsUploadModalVisible(state, action) {
      state.isUploadModalVisible = action.payload;
    },
    setLoadingStatus(state, action) {
      const {bool, view} = action.payload;
      state.loading[view] = bool;
    },
    setModalValues(state, action) {
      state.modalValues = action.payload;
    },
    setModalVisible(state, action) {
      state.modalVisible = action.payload.modal;
    },
    setShortcutSwitchPositions(state, action) {
      // console.log('Toggling Shortcut', action.payload.switchName);
      state.shortcutSwitchPosition[action.payload.switchName] = !state.shortcutSwitchPosition[action.payload.switchName];
      if (action.payload.switchName === 'all') {
        Object.keys(state.shortcutSwitchPosition).forEach(
          key => (state.shortcutSwitchPosition[key] = state.shortcutSwitchPosition.all));
      }
      else state.shortcutSwitchPosition.all = false;
      // console.log('Shortcut Switch Positions', JSON.stringify(Object.entries(state.shortcutSwitchPosition)));
    },
    setStatusMessageModalTitle(state, action) {
      state.statusMessageModalTitle = action.payload;
    },
  },
});

export const {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  resetHiddenWarnings,
  resetHomeState,
  setIsBackupModalVisible,
  setIsErrorMessagesModalVisible,
  setGeolocationTimeout,
  setIsMainMenuPanelVisible,
  setIsOfflineMapsModalVisible,
  setIsProgressModalVisible,
  setIsProjectLoadSelectionModalVisible,
  setIsSessionExpiredModalVisible,
  setIsStatusMessagesModalVisible,
  setIsUploadModalVisible,
  setIsWarningHidden,
  setIsWarningMessagesModalVisible,
  setLoadingStatus,
  setModalValues,
  setModalVisible,
  setShortcutSwitchPositions,
  setStatusMessageModalTitle,
} = homeSlice.actions;

export default homeSlice.reducer;
