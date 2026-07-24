import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {createLogger} from 'redux-logger';
import {createMigrate, persistReducer, persistStore} from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import listenerMiddleware from './listenerMiddleware';
import compassSlice from '../modules/compass/compass.slice';
import connectionsSlice from '../modules/connections/connections.slice';
import homeSlice from '../modules/home/home.slice';
import mainMenuSlice from '../modules/main-menu-panel/mainMenuPanel.slice';
import mapsSlice from '../modules/maps/maps.slice';
import offlineMapsSlice from '../modules/maps/offline-maps/offlineMaps.slice';
import notebookSlice from '../modules/notebook-panel/notebook.slice';
import projectSlice from '../modules/project/projects.slice';
import spotsSlice from '../modules/spots/spots.slice';
import userSlice from '../modules/user/userProfile.slice';

const migrations = {
  1: state => ({
    ...state,
    user: {
      ...state.user,
      macrostrat: state.user?.macrostrat ?? {
        token: null,
        expires: null,
        checkedInSpotIds: [],
      },
    },
  }),
};

// Redux Persist
export const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  blacklist: [
    'compass',
    'home',
    'mainMenu',
    'map',
    'notebook',
    'spot',
  ],
  migrate: createMigrate(migrations, {debug: false}),
  stateReconciler: autoMergeLevel2,
  timeout: null,
};

const connectionsConfig = {
  key: 'connections',
  storage: AsyncStorage,
  blacklist: ['isAutoSaving', 'isAutoSyncing', 'isManualSyncRequested', 'isTransferringImages', 'nextAutoSaveTime',
    'nextAutoSyncTime'],
  timeout: null,
};

const compassConfig = {
  key: 'compass',
  storage: AsyncStorage,
  blacklist: ['measurements'],
  timeout: null,
};

const homeConfig = {
  key: 'home',
  storage: AsyncStorage,
  blacklist: [
    'imageProgress',
    'isBackupModalVisible',
    'isErrorMessagesModalVisible',
    'isImageModalVisible',
    'isMainMenuPanelVisible',
    'isOfflineMapModalVisible',
    'isProgressModalVisible',
    'isProjectLoadSelectionModalVisible',
    'isStatusMessagesModalVisible',
    'isUploadModalVisible',
    'isUploadProgressModalVisible',
    'loading',
    'modalValues',
    'modalVisible',
    'statusMessageModalTitle',
    'statusMessages',
  ],
  timeout: null,
};

const notebookConfig = {
  key: 'notebook',
  storage: AsyncStorage,
  blacklist: [
    'isNotebookPanelVisible',
    'visibleNotebookPagesStack',
  ],
  timeout: null,
};

const mainMenuConfig = {
  key: 'mainMenu',
  storage: AsyncStorage,
  blacklist: [
    'isSidePanelVisible',
    'mainMenuPageVisible',
    'sidePanelView',
  ],
  timeout: null,
};

const mapConfig = {
  key: 'map',
  storage: AsyncStorage,
  timeout: null,
  blacklist: [
    'freehandFeatureCoords',
    'isMapExtentFilterActive',
    'selectedCustomMapToEdit',
    'vertexEndCoords',
    'vertexStartCoords',
  ],
};

const projectConfig = {
  key: 'project',
  storage: AsyncStorage,
  blacklist: [
    'datasets',
    'project',
    'isImageTransferring',
  ],
  timeout: null,
};

const spotsConfig = {
  key: 'spot',
  storage: AsyncStorage,
  blacklist: ['selectedAttributes'],
  timeout: null,
};

const loggerMiddleware = createLogger({
  predicate: () => process.env.NODE_ENV === 'development',
  collapsed: (getState, action, logEntry) => !logEntry.error,
});

const combinedReducers = combineReducers({
  compass: persistReducer(compassConfig, compassSlice),
  connections: persistReducer(connectionsConfig, connectionsSlice),
  home: persistReducer(homeConfig, homeSlice),
  mainMenu: persistReducer(mainMenuConfig, mainMenuSlice),
  map: persistReducer(mapConfig, mapsSlice),
  notebook: persistReducer(notebookConfig, notebookSlice),
  offlineMap: offlineMapsSlice,
  project: persistReducer(projectConfig, projectSlice),
  spot: persistReducer(spotsConfig, spotsSlice),
  user: userSlice,
});

const rootReducer = (state, action) => {
  return combinedReducers(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const defaultMiddlewareOptions = {
  immutableCheck: false,
  serializableCheck: false,
  // serializableCheck: {
  //   ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
  //   warnAfter: 60,
  // },
};

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => __DEV__
    ? getDefaultMiddleware(defaultMiddlewareOptions)
      .concat(loggerMiddleware, listenerMiddleware.middleware)
    : getDefaultMiddleware(defaultMiddlewareOptions).concat(listenerMiddleware.middleware),
});

let persistor = persistStore(store);

export {store, persistor};
