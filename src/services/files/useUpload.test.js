import React from 'react';

import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useUpload, {isManualUploadRunning} from './useUpload';
import connectionsReducer, {setAutoSyncing, setConflictedDatasetIds} from '../../modules/connections/connections.slice';
import homeReducer from '../../modules/home/home.slice';
import projectReducer, {addedProjectFromServer} from '../../modules/project/projects.slice';
import spotReducer, {editedSpotProperties} from '../../modules/spots/spots.slice';
import listenerMiddleware from '../../store/listenerMiddleware';
import propagateModifiedTimestamps from '../../store/propagateModifiedTimestamps';

const mockServer = {
  addDatasetToProject: jest.fn(),
  deleteAllSpotsInDataset: jest.fn(),
  updateDataset: jest.fn(),
  updateDatasetSpots: jest.fn(),
  updateProject: jest.fn(),
};
let mockStore;

jest.mock('../network/useServerRequests', () => () => mockServer);
jest.mock('./useAutoSave', () => ({useAutoSaveNow: () => ({autoSaveNow: async () => ({})})}));
jest.mock('./useUploadImages', () => () => ({initializeImageUpload: jest.fn()}));
jest.mock('../../modules/project/useProject', () => () => ({checkValidDateTime: () => {}}));
jest.mock('../../store/ConfigureStore', () => ({store: {getState: () => mockStore.getState()}}));

const makeSpot = id => ({
  geometry: {coordinates: [0, 0], type: 'Point'},
  properties: {date: '2026-01-01', id: id, modified_timestamp: 1, name: 'Spot ' + id, time: '2026-01-01'},
  type: 'Feature',
});

// Dataset 12 has a local edit queued for sync
const renderHook = () => {
  const store = configureStore({
    middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    preloadedState: {
      connections: {...connectionsReducer(undefined, {type: 'init'}), pendingUploadDatasetIds: [12]},
      project: {
        ...projectReducer(undefined, {type: 'init'}),
        datasets: {
          12: {id: 12, modified_timestamp: 5, name: 'Dataset', spotIds: [1]},
          13: {id: 13, modified_timestamp: 5, name: 'Second Dataset', spotIds: []},
        },
        project: {description: {project_name: 'Project'}, id: 1, modified_timestamp: 5},
      },
      spot: {...spotReducer(undefined, {type: 'init'}), spots: {1: makeSpot(1)}},
    },
    reducer: propagateModifiedTimestamps(combineReducers({
      connections: connectionsReducer,
      home: homeReducer,
      project: projectReducer,
      spot: spotReducer,
      user: (state = {encoded_login: 'login'}) => state,
    })),
  });
  mockStore = store;
  let hookApi;
  const Probe = () => {
    hookApi = useUpload();
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
  });
  return {getHook: () => hookApi, store};
};

const uploadDataset12 = async (getHook) => {
  await ReactTestRenderer.act(async () => {
    await getHook().uploadDatasetsByIds([12]);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockServer.addDatasetToProject.mockResolvedValue({});
  mockServer.updateDataset.mockResolvedValue({modified_on_server: true});
  mockServer.updateDatasetSpots.mockResolvedValue({});
  mockServer.updateProject.mockResolvedValue({});
});

// The server only takes a copy newer than its own, so keeping the device's copy has to send it with a new timestamp
it('sends the device copy with a newer timestamp when keeping it over a conflict', async () => {
  const {getHook, store} = renderHook();
  store.dispatch(setConflictedDatasetIds(['12']));
  await ReactTestRenderer.act(async () => {
    await getHook().keepDeviceConflict(12);
  });
  const sentDataset = mockServer.updateDataset.mock.calls.at(-1)[0];
  expect(sentDataset.id).toBe(12);
  expect(sentDataset.modified_timestamp).toBeGreaterThan(5);
  expect(store.getState().connections.conflictedDatasetIds).toEqual([]);
  expect(store.getState().connections.pendingUploadDatasetIds).toEqual([]);
});

it('takes an uploaded dataset off the sync queue', async () => {
  const {getHook, store} = renderHook();
  await uploadDataset12(getHook);
  expect(store.getState().connections.pendingUploadDatasetIds).toEqual([]);
  expect(store.getState().connections.lastSyncedDatasetTimestamps[12]).toBe(5);
});

// The upload sent the copy from before the edit, so the edit still has to go up
it('keeps a dataset edited while it was uploading on the sync queue', async () => {
  const {getHook, store} = renderHook();
  mockServer.updateDatasetSpots.mockImplementation(async () => {
    store.dispatch(editedSpotProperties({field: 'notes', spotId: 1, value: 'Edited mid-upload'}));
    return {};
  });
  await uploadDataset12(getHook);
  expect(store.getState().connections.pendingUploadDatasetIds.map(String)).toEqual(['12']);
  expect(store.getState().connections.lastSyncedDatasetTimestamps[12]).toBe(5);
});

// The server can't take two uploads of the same datasets at once
it('refuses a manual upload while a sync is running', async () => {
  const {getHook, store} = renderHook();
  store.dispatch(setAutoSyncing(true));
  await ReactTestRenderer.act(async () => {
    await expect(getHook().initializeUpload()).rejects.toThrow('A sync with the server is running');
  });
  expect(mockServer.updateProject).not.toHaveBeenCalled();
  expect(isManualUploadRunning()).toBe(false);
});

it('marks a manual upload as running until it ends', () => {
  const {getHook} = renderHook();
  expect(getHook().startManualUpload()).toBeUndefined();
  expect(isManualUploadRunning()).toBe(true);
  expect(getHook().startManualUpload()).toMatch('Please wait');
  getHook().endManualUpload();
  expect(isManualUploadRunning()).toBe(false);
});

const openOtherProject = store => (
  store.dispatch(addedProjectFromServer({description: {project_name: 'Other'}, id: 2, modified_timestamp: 1}))
);

// The rest belong to the project that was open, so they must not go up as part of it or touch the new one's sync state
it('stops uploading datasets when another project is opened', async () => {
  const {getHook, store} = renderHook();
  mockServer.updateDatasetSpots.mockImplementation(async () => {
    openOtherProject(store);
    return {};
  });
  await ReactTestRenderer.act(async () => {
    await expect(getHook().uploadDatasetsByIds([12, 13])).rejects.toThrow('The open project changed');
  });
  expect(mockServer.updateDataset.mock.calls.map(([dataset]) => dataset.id)).toEqual([12]);
  expect(store.getState().connections.lastSyncedDatasetTimestamps).toEqual({});
});

it('flags no conflict on the newly opened project when the server turns down the old one', async () => {
  const {getHook, store} = renderHook();
  mockServer.updateDataset.mockImplementation(async () => {
    openOtherProject(store);
    return {modified_on_server: false};
  });
  await uploadDataset12(getHook);
  expect(store.getState().connections.conflictedDatasetIds).toEqual([]);
});
