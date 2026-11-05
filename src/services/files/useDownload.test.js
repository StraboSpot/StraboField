import React from 'react';

import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useDownload, {isDownloadRunning} from './useDownload';
import connectionsReducer from '../../modules/connections/connections.slice';
import homeReducer from '../../modules/home/home.slice';
import {CUSTOM_MAP_SOURCES} from '../../modules/maps/custom-maps/customMaps.constants';
import mapReducer from '../../modules/maps/maps.slice';
import projectReducer, {addedProjectFromServer} from '../../modules/project/projects.slice';
import spotReducer from '../../modules/spots/spots.slice';
import listenerMiddleware from '../../store/listenerMiddleware';
import propagateModifiedTimestamps from '../../store/propagateModifiedTimestamps';

const mockServer = {
  getDatasets: jest.fn(),
  getDatasetSpots: jest.fn(),
  getProject: jest.fn(),
  testCustomMapUrl: jest.fn(),
};
const mockNewDataset = {id: 99, modified_timestamp: 1, name: 'Default', spotIds: []};
const mockDevice = {
  deleteProfileImageFile: jest.fn(),
  pruneOldProjectSaves: jest.fn(),
  saveProjectToDevice: jest.fn(),
};
const mockAlert = jest.fn();
let mockStore;

jest.mock('../network/useServerRequests', () => () => mockServer);
jest.mock('../device/useDevice', () => () => mockDevice);
jest.mock('../../shared/ui/alert', () => (...args) => mockAlert(...args));
jest.mock('../../modules/images/useImages', () => () => ({gatherNeededImages: async () => undefined}));
jest.mock('../../modules/project/useProject', () => () => ({createDataset: () => mockNewDataset}));
jest.mock('../../store/ConfigureStore', () => ({store: {getState: () => mockStore.getState()}}));
jest.mock('../../shared/ui/modals/modal.constants', () => ({
  ...jest.requireActual('../../shared/ui/modals/modal.constants'),
  MODAL_TRANSITION_DELAY: 0,
}));

const makeSpot = (id, name) => ({
  geometry: {coordinates: [0, 0], type: 'Point'},
  properties: {id: id, modified_timestamp: 1, name: name},
  type: 'Feature',
});

// The project open on the device before the download, on a custom endpoint so My Maps entries are checked against it
const getPreloadedState = () => ({
  connections: {
    ...connectionsReducer(undefined, {type: 'init'}),
    databaseEndpoint: {endpoint: 'https://custom.example/db', isSelected: true, isVerified: true},
  },
  project: {
    ...projectReducer(undefined, {type: 'init'}),
    activeDatasetsIds: [12],
    datasets: {12: {id: 12, modified_timestamp: 1, name: 'Open', spotIds: [1]}},
    project: {description: {project_name: 'Open'}, id: 1, modified_timestamp: 1},
    targetDatasetId: 12,
  },
  spot: {...spotReducer(undefined, {type: 'init'}), spots: {1: makeSpot(1, 'Open')}},
});

const renderHook = (preloadedState = getPreloadedState()) => {
  const store = configureStore({
    middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    preloadedState: preloadedState,
    reducer: propagateModifiedTimestamps(combineReducers({
      connections: connectionsReducer,
      home: homeReducer,
      map: mapReducer,
      project: projectReducer,
      spot: spotReducer,
      user: (state = {encoded_login: 'login'}) => state,
    })),
  });
  mockStore = store;
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

const pressAlertButton = text => mockAlert.mockImplementation((title, message, buttons) => (
  buttons.find(button => button.text === text).onPress()
));

beforeEach(() => {
  mockAlert.mockReset();
  mockDevice.saveProjectToDevice.mockReset();
  mockServer.getProject.mockClear();
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

// A download replaces the open project, so changes not yet saved to the device are saved first
it('saves the open project to the device before replacing it', async () => {
  const preloadedState = getPreloadedState();
  preloadedState.connections.isLocalSaveNeeded = true;
  const {getHook, store} = renderHook(preloadedState);
  expect(await download(getHook)).toBeUndefined();
  expect(mockDevice.saveProjectToDevice).toHaveBeenCalledTimes(1);
  const snapshot = mockDevice.saveProjectToDevice.mock.calls[0][0];
  expect(snapshot.projectDb.project.id).toBe(1);
  expect(snapshot.spotsDb).toEqual({1: makeSpot(1, 'Open')});
  expect(store.getState().home.statusMessages).toContain('Saved a backup of the current project to the device.');
});

it('skips the save when nothing has changed since the last one', async () => {
  const {getHook, store} = renderHook();
  expect(await download(getHook)).toBeUndefined();
  expect(mockDevice.saveProjectToDevice).not.toHaveBeenCalled();
  expect(mockAlert).not.toHaveBeenCalled();
  expect(store.getState().home.statusMessages.some(msg => msg.includes('backup'))).toBe(false);
});

describe('when the save before the download fails', () => {
  const renderWithFailingSave = () => {
    mockDevice.saveProjectToDevice.mockRejectedValue(new Error('Disk full'));
    const preloadedState = getPreloadedState();
    preloadedState.connections.isLocalSaveNeeded = true;
    return renderHook(preloadedState);
  };

  it('leaves the open project as it was when the user cancels', async () => {
    pressAlertButton('Cancel');
    const {getHook, store} = renderWithFailingSave();
    const before = store.getState();
    let isDownloaded;
    await ReactTestRenderer.act(async () => {
      isDownloaded = await getHook().initializeDownload({id: 2, name: 'From server'});
    });
    expect(isDownloaded).toBe(false);
    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockServer.getProject).not.toHaveBeenCalled();
    expect(store.getState().project).toEqual(before.project);
    expect(store.getState().spot).toEqual(before.spot);
    expect(store.getState().home.isStatusMessagesModalVisible).toBe(false);
  });

  it('replaces the open project when the user downloads anyway', async () => {
    pressAlertButton('Download Anyway');
    const {getHook, store} = renderWithFailingSave();
    expect(await download(getHook)).toBeUndefined();
    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(store.getState().project.project.id).toBe(2);
    expect(store.getState().home.statusMessages)
      .toContain('Could not save a backup of the current project to the device.');
  });
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

// Auto sync pulls with the same Spot fetching a download uses, while a download can be under way
describe('an auto sync pull alongside a download', () => {
  const pulledDataset = {id: 12, modified_timestamp: 9, name: 'Open'};
  const pulledSpots = {features: [makeSpot(3, 'Pulled')]};
  const downloadedSpots = {features: [makeSpot(2, 'From server')]};

  const deferred = () => {
    let resolve;
    const promise = new Promise((res) => {
      resolve = res;
    });
    return {promise, resolve};
  };

  it('stays out of a download that is still collecting', async () => {
    const downloadSpots = deferred();
    mockServer.getDatasetSpots.mockImplementation(id => (id === 22 ? downloadSpots.promise
      : Promise.resolve(pulledSpots)));
    const {getHook, store} = renderHook();
    await ReactTestRenderer.act(async () => {
      const downloading = getHook().initializeDownload({id: 2, name: 'From server'});
      while (!mockServer.getDatasetSpots.mock.calls.some(([id]) => id === 22)) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      expect(isDownloadRunning()).toBe(true);
      await getHook().applyServerDownloads([pulledDataset]);
      downloadSpots.resolve(downloadedSpots);
      await downloading;
    });
    const {project, spot} = store.getState();
    expect(project.datasets[22]).toEqual({id: 22, modified_timestamp: 5, name: 'From server', spotIds: [2]});
    expect(Object.keys(spot.spots)).toEqual(['2']);
    expect(isDownloadRunning()).toBe(false);
  });

  it('is dropped when a download replaced the project while it was fetching', async () => {
    const pullSpots = deferred();
    mockServer.getDatasetSpots.mockImplementation(id => (id === 12 ? pullSpots.promise
      : Promise.resolve(downloadedSpots)));
    const {getHook, store} = renderHook();
    await ReactTestRenderer.act(async () => {
      const pulling = getHook().applyServerDownloads([pulledDataset]);
      await getHook().initializeDownload({id: 2, name: 'From server'});
      pullSpots.resolve(pulledSpots);
      await pulling;
    });
    const {project, spot} = store.getState();
    expect(Object.keys(project.datasets)).toEqual(['22']);
    expect(Object.keys(spot.spots)).toEqual(['2']);
  });
});

// What auto sync pulls lands in the open project, so it is saved to the device like a change made here
describe('an auto sync pull', () => {
  const openProject = {description: {project_name: 'Open'}, id: 1, modified_timestamp: 1};

  const pull = async (staleDatasets) => {
    const {getHook, store} = renderHook();
    // Loaded the way a real project is, so it is normalized like the server's copy will be
    store.dispatch(addedProjectFromServer(openProject));
    await ReactTestRenderer.act(async () => {
      await getHook().applyServerDownloads(staleDatasets, {applyProject: true});
    });
    return store.getState().connections.isLocalSaveNeeded;
  };

  it('flags a device save when it applies a dataset', async () => {
    mockServer.getProject.mockResolvedValue(openProject);
    mockServer.getDatasetSpots.mockResolvedValue({features: [makeSpot(3, 'Pulled')]});
    expect(await pull([{id: 12, modified_timestamp: 9, name: 'Open'}])).toBe(true);
  });

  it('flags a device save when the project changed on the server', async () => {
    mockServer.getProject.mockResolvedValue({...openProject, description: {project_name: 'Renamed'}});
    expect(await pull([])).toBe(true);
  });

  // The server's copy is re-applied every cycle it is no older, which must not save every cycle
  it('does not flag a device save when nothing changed', async () => {
    mockServer.getProject.mockResolvedValue(openProject);
    expect(await pull([])).toBe(false);
  });
});

// A My Maps entry is kept only once its tiles are found on the custom endpoint, which can take longer than the rest
// of the download. Resolving the check on a later tick stands in for a slow server.
describe('custom maps', () => {
  const myMap = {id: 'my-map', source: CUSTOM_MAP_SOURCES.STRABO_MY_MAPS, title: 'My Map'};
  const otherMyMap = {id: 'other-my-map', source: CUSTOM_MAP_SOURCES.STRABO_MY_MAPS, title: 'Other My Map'};
  const mapboxMap = {id: 'user/style', source: CUSTOM_MAP_SOURCES.MAPBOX_STYLES, title: 'Mapbox Map'};
  const resolveLater = value => new Promise(resolve => setTimeout(() => resolve(value), 0));

  const downloadWithMaps = async (otherMaps) => {
    mockServer.getProject.mockResolvedValue(
      {description: {project_name: 'From server'}, id: 2, modified_timestamp: 5, other_maps: otherMaps});
    const {getHook, store} = renderHook();
    const error = await download(getHook);
    const {home, map} = store.getState();
    return {customMaps: map.customMaps, error, statusMessages: home.statusMessages};
  };

  it('keeps a My Maps map whose check finishes after the rest of the download', async () => {
    mockServer.testCustomMapUrl.mockImplementation(() => resolveLater(true));
    const {customMaps, error} = await downloadWithMaps([myMap, mapboxMap]);
    expect(error).toBeUndefined();
    expect(Object.keys(customMaps).sort()).toEqual(['my-map', 'user/style']);
    expect(customMaps['my-map'].url).toEqual(['https://custom.example/geotiff/tiles/']);
  });

  // One map whose tiles aren't on the endpoint must not take the others with it, or fail the download
  it('keeps the other maps when one My Maps map fails its check', async () => {
    mockServer.testCustomMapUrl.mockImplementation(url => resolveLater(!url.endsWith(otherMyMap.id)));
    const {customMaps, error, statusMessages} = await downloadWithMaps([myMap, otherMyMap, mapboxMap]);
    expect(error).toBeUndefined();
    expect(Object.keys(customMaps).sort()).toEqual(['my-map', 'user/style']);
    expect(statusMessages).toContain('Custom Map Not Loaded: Other My Map');
  });
});
