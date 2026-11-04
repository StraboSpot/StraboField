import React from 'react';

import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useDownload from './useDownload';
import connectionsReducer from '../../modules/connections/connections.slice';
import projectReducer from '../../modules/project/projects.slice';
import spotReducer from '../../modules/spots/spots.slice';
import listenerMiddleware from '../../store/listenerMiddleware';
import propagateModifiedTimestamps from '../../store/propagateModifiedTimestamps';

const mockServer = {
  getDatasets: jest.fn(),
  getDatasetSpots: jest.fn(),
  getProject: jest.fn(),
};
const mockNewDataset = {id: 99, modified_timestamp: 1, name: 'Default', spotIds: []};

jest.mock('../network/useServerRequests', () => () => mockServer);
jest.mock('../device/useDevice', () => () => ({deleteProfileImageFile: jest.fn()}));
jest.mock('../../modules/images/useImages', () => () => ({gatherNeededImages: async () => undefined}));
jest.mock('../../modules/project/useProject', () => () => ({createDataset: () => mockNewDataset}));
jest.mock('../../store/ConfigureStore', () => ({store: {getState: () => ({user: {}})}}));
jest.mock('../../shared/ui/modals/modal.constants', () => ({
  ...jest.requireActual('../../shared/ui/modals/modal.constants'),
  MODAL_TRANSITION_DELAY: 0,
}));

const makeSpot = (id, name) => ({
  geometry: {coordinates: [0, 0], type: 'Point'},
  properties: {id: id, modified_timestamp: 1, name: name},
  type: 'Feature',
});

// The project open on the device before the download
const getPreloadedState = () => ({
  project: {
    ...projectReducer(undefined, {type: 'init'}),
    activeDatasetsIds: [12],
    datasets: {12: {id: 12, modified_timestamp: 1, name: 'Open', spotIds: [1]}},
    project: {description: {project_name: 'Open'}, id: 1, modified_timestamp: 1},
    targetDatasetId: 12,
  },
  spot: {...spotReducer(undefined, {type: 'init'}), spots: {1: makeSpot(1, 'Open')}},
});

const renderHook = () => {
  const store = configureStore({
    middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    preloadedState: getPreloadedState(),
    reducer: propagateModifiedTimestamps(combineReducers({
      connections: connectionsReducer,
      project: projectReducer,
      spot: spotReducer,
      user: (state = {encoded_login: 'login'}) => state,
    })),
  });
  let hookApi;
  const Probe = () => {
    hookApi = useDownload();
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
  });
  return {getHook: () => hookApi, store};
};

const download = async (getHook) => {
  let error;
  await ReactTestRenderer.act(async () => {
    try {
      await getHook().initializeDownload({id: 2, name: 'From server'});
    }
    catch (err) {
      error = err;
    }
  });
  return error;
};

beforeEach(() => {
  mockServer.getProject.mockResolvedValue({description: {project_name: 'From server'}, id: 2, modified_timestamp: 5});
  mockServer.getDatasets.mockResolvedValue({datasets: [{id: 22, modified_timestamp: 5, name: 'From server'}]});
  mockServer.getDatasetSpots.mockResolvedValue({features: [makeSpot(2, 'From server')]});
});

it('leaves the open project as it was when the download fails partway', async () => {
  mockServer.getDatasetSpots.mockRejectedValue('Network error');
  const {getHook, store} = renderHook();
  const before = store.getState();
  expect(await download(getHook)).toBe('Network error');
  expect(store.getState().project).toEqual(before.project);
  expect(store.getState().spot).toEqual(before.spot);
  expect(store.getState().connections.isLocalSaveNeeded).toBe(false);
});

it('replaces the open project when the download succeeds', async () => {
  const {getHook, store} = renderHook();
  expect(await download(getHook)).toBeUndefined();
  const {project, spot} = store.getState();
  expect(project.project.id).toBe(2);
  expect(Object.keys(project.datasets)).toEqual(['22']);
  expect(project.datasets[22].spotIds).toEqual([2]);
  expect(Object.keys(spot.spots)).toEqual(['2']);
  expect(project.activeDatasetsIds).toEqual([22]);
  expect(project.targetDatasetId).toBe(22);
  expect(store.getState().connections.isLocalSaveNeeded).toBe(false);
});

// The dataset made for a project with none is a change made here, so it is kept and counts as unsaved
it('keeps the dataset made for a project with none', async () => {
  mockServer.getDatasets.mockResolvedValue({datasets: []});
  const {getHook, store} = renderHook();
  expect(await download(getHook)).toBeUndefined();
  const {project} = store.getState();
  expect(Object.keys(project.datasets)).toEqual(['99']);
  expect(project.activeDatasetsIds).toEqual([99]);
  expect(project.targetDatasetId).toBe(99);
  expect(store.getState().connections.isLocalSaveNeeded).toBe(true);
});
