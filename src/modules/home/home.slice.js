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
  messageModal: {isVisible: false, message: '', title: ''},
  modalValues: {},
  modalVisible: null,
  hiddenWarnings: {},
  isBackupModalVisible: false,
  isStatusMessagesModalVisible: false,
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
    // Only hide. The modal stays mounted through its fade-out, and clearing the text here blanks the header and
    // body for the ~270ms the animation runs. openedMessageModal always sets all three fields, so leaving the old
    // text in place can't leak to the next caller.
    closedMessageModal(state) {
      state.messageModal.isVisible = false;
    },
    openedMessageModal(state, action) {
      const {message, title} = action.payload;
      state.messageModal = {isVisible: true, message, title};
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
  closedMessageModal,
  openedMessageModal,
  removedLastStatusMessage,
  resetHiddenWarnings,
  resetHomeState,
  setIsBackupModalVisible,
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
