import {Platform} from 'react-native';

import {createSlice} from '@reduxjs/toolkit';

const initialHomeState = {
  statusMessages: [],
  geolocationTimeout: 120000,
  imageProgress: {
    imagesDownloadedCount: 0,
    neededImageIds: 0,
  },
  // Drives the ProgressBar in StatusModal while a project's offline maps are unzipped and moved into place.
  // progress is 0-1; a non-empty label means an import phase is active and the bar should be shown.
  mapImportProgress: {
    progress: 0,
    label: '',
  },
  loading: {
    modal: false,
    home: false,
  },
  messageModal: {isVisible: false, message: '', title: ''},
  modalValues: {},
  modalVisible: null,
  // The next modal to show once the current one has finished dismissing (iOS two-phase switch). See setModalVisible.
  pendingModal: null,
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
    resetMapImportProgress(state) {
      state.mapImportProgress = {progress: 0, label: ''};
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
    setMapImportProgress(state, action) {
      state.mapImportProgress = {...state.mapImportProgress, ...action.payload};
    },
    setLoadingStatus(state, action) {
      const {bool, view} = action.payload;
      state.loading[view] = bool;
    },
    setModalValues(state, action) {
      state.modalValues = action.payload;
    },
    // iOS presents every RN <Modal> as a native UIViewController transition. Swapping one modal for another in a
    // single commit runs a present and a dismiss concurrently, which trips UIViewControllerHierarchyInconsistency
    // (a fatal crash, Sentry STRABOSPOT-2-6JN) or silently drops the incoming modal. Two-phase it on iOS: dismiss the
    // current modal now and stash the next key in pendingModal, then let applyPendingModal show it once the dismiss
    // transition has finished (driven centrally in OverlaysContainer, with ModalWrapper's onDismiss as a fast path).
    // Other platforms have no such race, so they swap directly.
    setModalVisible(state, action) {
      const next = action.payload.modal;
      if (Platform.OS === 'ios' && next && state.modalVisible && next !== state.modalVisible) {
        state.pendingModal = next;
        state.modalVisible = null;
      }
      else {
        state.pendingModal = null;
        state.modalVisible = next;
      }
    },
    // Show the modal queued by a two-phase switch, once the outgoing modal has dismissed. A no-op when nothing is
    // queued, so it is safe to fire from both the transition timer and onDismiss.
    applyPendingModal(state) {
      if (state.pendingModal == null) return;
      state.modalVisible = state.pendingModal;
      state.pendingModal = null;
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
  applyPendingModal,
  clearedStatusMessages,
  closedMessageModal,
  openedMessageModal,
  removedLastStatusMessage,
  resetHiddenWarnings,
  resetHomeState,
  resetMapImportProgress,
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
  setMapImportProgress,
  setModalValues,
  setModalVisible,
  setShortcutSwitchPositions,
  setStatusMessageModalTitle,
} = homeSlice.actions;

export default homeSlice.reducer;
