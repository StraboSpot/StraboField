import React from 'react';

import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useUpload from './useUpload';
import connectionsReducer from '../../modules/connections/connections.slice';
import homeReducer from '../../modules/home/home.slice';
import projectReducer from '../../modules/project/projects.slice';
import spotReducer, {editedSpotProperties} from '../../modules/spots/spots.slice';
import listenerMiddleware from '../../store/listenerMiddleware';
import propagateModifiedTimestamps from '../../store/propagateModifiedTimestamps';

const mockServer = {
  addDatasetToProject: jest.fn(),
  deleteAllSpotsInDataset: jest.fn(),
  updateDataset: jest.fn(),
  updateDatasetSpots: jest.fn(),
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
        datasets: {12: {id: 12, modified_timestamp: 5, name: 'Dataset', spotIds: [1]}},
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
  mockServer.addDatasetToProject.mockResolvedValue({});
  mockServer.updateDataset.mockResolvedValue({modified_on_server: true});
  mockServer.updateDatasetSpots.mockResolvedValue({});
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
