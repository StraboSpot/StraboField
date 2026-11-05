import React from 'react';

import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useAutoSync from './useAutoSync';
import connectionsReducer from '../../modules/connections/connections.slice';
import homeReducer from '../../modules/home/home.slice';
import {MapEditContext} from '../../modules/maps/MapEditContext';
import mapReducer from '../../modules/maps/maps.slice';
import projectReducer, {addedProjectFromServer} from '../../modules/project/projects.slice';

const mockDownload = {applyServerDownloads: jest.fn(), classifyServerDatasets: jest.fn()};
const mockUpload = {uploadDatasetsByIds: jest.fn(), uploadProject: jest.fn()};
let mockIsManualUploadRunning;
let mockStore;
let renderer;

jest.mock('../files/useDownload', () => ({
  __esModule: true,
  default: () => mockDownload,
  isDownloadRunning: () => false,
}));
jest.mock('../files/useUpload', () => ({
  __esModule: true,
  default: () => mockUpload,
  isManualUploadRunning: () => mockIsManualUploadRunning,
}));
jest.mock('../files/useUploadImages', () => () => ({initializeImageUpload: jest.fn()}));
jest.mock('../../store/ConfigureStore', () => ({store: {getState: () => mockStore.getState()}}));

// Online with auto sync on, so the hook syncs as soon as it mounts (it counts that as coming online). Map editing
// covers an interval drag too.
const renderHook = ({isMapEditing = false, isProjectSyncNeeded = false} = {}) => {
  const store = configureStore({
    preloadedState: {
      connections: {
        ...connectionsReducer(undefined, {type: 'init'}),
        backupFrequency: {save: 0, sync: 5},
        isOnline: {isConnected: true, type: 'wifi'},
        isProjectSyncNeeded: isProjectSyncNeeded,
      },
      map: mapReducer(undefined, {type: 'init'}),
      project: {...projectReducer(undefined, {type: 'init'}), project: {id: 1, modified_timestamp: 1}},
    },
    reducer: combineReducers({
      connections: connectionsReducer,
      home: homeReducer,
      map: mapReducer,
      project: projectReducer,
    }),
  });
  mockStore = store;
  const Probe = () => {
    useAutoSync();
    return null;
  };
  return ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <Provider store={store}>
        <MapEditContext.Provider value={{isMapEditing: () => isMapEditing}}><Probe/></MapEditContext.Provider>
      </Provider>,
    );
  });
};

// Unmounting clears the timer for the next scheduled sync, which would otherwise keep Jest running
afterEach(() => {
  ReactTestRenderer.act(() => renderer.unmount());
});

beforeEach(() => {
  mockIsManualUploadRunning = false;
  mockUpload.uploadDatasetsByIds.mockReset();
  mockUpload.uploadProject.mockReset();
  mockDownload.applyServerDownloads.mockReset().mockResolvedValue(undefined);
  mockDownload.classifyServerDatasets.mockReset().mockResolvedValue({conflictIds: [], toPull: []});
});

it('syncs when nothing is in the way', async () => {
  await renderHook();
  expect(mockDownload.classifyServerDatasets).toHaveBeenCalled();
});

it('waits while the map is being edited', async () => {
  await renderHook({isMapEditing: true});
  expect(mockDownload.classifyServerDatasets).not.toHaveBeenCalled();
  expect(mockDownload.applyServerDownloads).not.toHaveBeenCalled();
});

it('waits while a manual upload runs', async () => {
  mockIsManualUploadRunning = true;
  await renderHook();
  expect(mockDownload.classifyServerDatasets).not.toHaveBeenCalled();
});

// What the server was checked against belongs to the project that was open, so none of it may land on the new one
it('stops when another project is opened while checking the server', async () => {
  mockDownload.classifyServerDatasets.mockImplementation(async () => {
    mockStore.dispatch(addedProjectFromServer({id: 2, modified_timestamp: 1}));
    return {conflictIds: ['7'], toPull: []};
  });
  await renderHook({isProjectSyncNeeded: true});
  expect(mockUpload.uploadProject).not.toHaveBeenCalled();
  expect(mockDownload.applyServerDownloads).not.toHaveBeenCalled();
  expect(mockStore.getState().connections.conflictedDatasetIds).toEqual([]);
});
