import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useDeleteDataset from './useDeleteDataset';
import connectionsReducer from '../../connections/connections.slice';
import homeReducer from '../../home/home.slice';
import mapReducer from '../../maps/maps.slice';
import spotReducer from '../../spots/spots.slice';
import userReducer from '../../user/userProfile.slice';
import projectReducer from '../projects.slice';

// A real toast keeps a timer running past the end of the test, and what matters here is only whether one was shown
const mockToastShow = jest.fn();
jest.mock('react-native-toast-notifications', () => ({
  ToastProvider: ({children}) => children,
  useToast: () => ({show: mockToastShow}),
}));

const parentId = 1756000000011;
const sampleId = 1756000000012;
const parent = {properties: {id: parentId, name: 'Spot 08', samples: [{id: sampleId}]}, type: 'Feature'};
const sample = {properties: {id: sampleId, isSample: true, name: 'Sample 1', samples: [{id: sampleId}]}};
const familySpots = {[parentId]: parent, [sampleId]: sample};
// The parent in one dataset and its sample in another, as only an old bug could leave them
const splitDatasets = {
  12: {id: 12, name: 'Dataset 1', spotIds: [parentId]},
  13: {id: 13, name: 'Dataset 2', spotIds: [sampleId]},
};
const otherSpotId = 1756000000099;    // A Spot filed in neither dataset
const memo = {id: 'r1', name: 'Memo 1', spots: [parentId, otherSpotId]};
const tag = {id: 't1', name: 'Tag 1', spots: [parentId, otherSpotId]};

// Native has nothing to wait for; a test can make the server's moves fail, as only web can
const mockWaitForMovesOutOf = jest.fn();
jest.mock('../../../store/listenerMiddleware', () => ({
  __esModule: true,
  ...jest.requireActual('../../../store/listenerMiddleware'),
  waitForMovesOutOf: (...args) => mockWaitForMovesOutOf(...args),
}));

beforeEach(() => {
  mockToastShow.mockClear();
  mockWaitForMovesOutOf.mockReset().mockResolvedValue(true);
});

// The datasets with those ids marked read only, as the server marks them
const markReadOnly = (datasets, readOnlyDatasetsIds) => Object.fromEntries(Object.entries(datasets).map(
  ([id, dataset]) => [id, readOnlyDatasetsIds.includes(dataset.id) ? {...dataset, isReadOnly: true} : dataset]));

const renderDeleteDatasetApi = (readOnlyDatasetsIds, {map = {}, spots = familySpots} = {}) => {
  const store = configureStore({
    preloadedState: {
      home: {activeModal: null, hiddenWarnings: {}, loading: {home: false}},
      map: {spotsInMapExtentIds: [], ...map},
      project: {
        activeDatasetsIds: [12, 13],
        datasets: markReadOnly(splitDatasets, readOnlyDatasetsIds),
        project: {reports: [memo], tags: [tag]},
        selectedTag: {},
      },
      spot: {recentViews: [], selectedAttributes: [], selectedSpot: {}, spots: spots},
    },
    reducer: {
      connections: connectionsReducer,
      home: homeReducer,
      map: mapReducer,
      project: projectReducer,
      spot: spotReducer,
      user: userReducer,
    },
  });
  let deleteDatasetApi;
  const Probe = () => {
    deleteDatasetApi = useDeleteDataset();
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
  });
  return {deleteDatasetApi: deleteDatasetApi, store: store};
};

// The dataset is passed as the page holding it would, which may be a copy older than the store's
const deleteDataset = async (datasetId, readOnlyDatasetsIds, dataset = splitDatasets[datasetId]) => {
  const {deleteDatasetApi, store} = renderDeleteDatasetApi(readOnlyDatasetsIds);
  let isDeleted;
  await ReactTestRenderer.act(async () => {
    isDeleted = await deleteDatasetApi.deleteDataset(dataset);
  });
  return {isDeleted: isDeleted, state: store.getState()};
};

const getDatasetDeleteCheck = (datasetId, readOnlyDatasetsIds) =>
  renderDeleteDatasetApi(readOnlyDatasetsIds).deleteDatasetApi.getDatasetDeleteCheck(splitDatasets[datasetId]);

// What the confirmation names, worked out before anything is deleted
it('names the samples a delete would take from other datasets, and those it would move to their parent\'s', () => {
  expect(getDatasetDeleteCheck(12, []))
    .toEqual({parentsToUnlink: [], readOnlyMessage: null, samplesToDelete: [sample], samplesToMove: []});
  expect(getDatasetDeleteCheck(13, [])).toEqual({
    parentsToUnlink: [],
    readOnlyMessage: null,
    samplesToDelete: [],
    samplesToMove: [{parentSpot: parent, sampleSpot: sample, spotIds: [sampleId], toDatasetId: 12}],
  });
});

it('says why a dataset whose Spot has a read only sample filed elsewhere can\'t be deleted', () => {
  expect(getDatasetDeleteCheck(12, [13]).readOnlyMessage).toMatch(/Sample Sample 1, .* is read only/);
});

it('says why a dataset holding a sample whose parent is in a read only dataset can\'t be deleted', () => {
  expect(getDatasetDeleteCheck(13, [12]).readOnlyMessage)
    .toMatch(/Sample Sample 1 can't be moved to the dataset of Spot Spot 08, .* is read only/);
});

// Deleting the parent's dataset deletes the sample filed elsewhere, as deleting the parent would
it('deletes a dataset together with the samples of its Spots filed elsewhere', async () => {
  const {isDeleted, state} = await deleteDataset(12, []);
  expect(isDeleted).toBe(true);
  expect(state.project.datasets[12]).toBeUndefined();
  expect(state.spot.spots).toEqual({});
  expect(state.project.datasets[13].spotIds).toEqual([]);
});

// The page's copy was taken before the parent was filed in the dataset, so only the store's knows of it and its sample
it('deletes the samples of the Spots the dataset holds now, not when its page opened', async () => {
  const {isDeleted, state} = await deleteDataset(12, [], {...splitDatasets[12], spotIds: []});
  expect(isDeleted).toBe(true);
  expect(state.spot.spots).toEqual({});
  expect(state.project.datasets[13].spotIds).toEqual([]);
});

// They used to be left there, pointing at Spots that were gone
it('takes the dataset\'s Spots out of the tags and memos holding them', async () => {
  const {state} = await deleteDataset(12, []);
  expect(state.project.project.tags[0].spots).toEqual([otherSpotId]);
  expect(state.project.project.reports[0].spots).toEqual([otherSpotId]);
});

// The sample is kept, back with the Spot it was taken at, rather than deleted from under it
it('deletes a dataset after moving its samples to the dataset of their parent filed elsewhere', async () => {
  const {isDeleted, state} = await deleteDataset(13, []);
  expect(isDeleted).toBe(true);
  expect(mockWaitForMovesOutOf).toHaveBeenCalledWith(13);
  expect(state.project.datasets[13]).toBeUndefined();
  expect(state.spot.spots).toEqual(familySpots);
  expect(state.project.datasets[12].spotIds).toEqual([parentId, sampleId]);
});

// On web the server still has the sample in the dataset, so deleting it there would delete the sample too
it('deletes nothing when the server failed to move the samples out', async () => {
  mockWaitForMovesOutOf.mockResolvedValue(false);
  const {isDeleted, state} = await deleteDataset(13, []);
  expect(isDeleted).toBe(false);
  expect(state.project.datasets[13]).toBeDefined();
  expect(state.spot.spots).toEqual(familySpots);
  expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('could not all be moved'), expect.anything());
});

// A delete tried before moved them on the device but not on the server, so this one has nothing of its own to move
it('deletes nothing, with nothing to move, while an earlier move out of it failed', async () => {
  mockWaitForMovesOutOf.mockResolvedValue(false);
  const {isDeleted, state} = await deleteDataset(12, []);
  expect(isDeleted).toBe(false);
  expect(mockWaitForMovesOutOf).toHaveBeenCalledWith(12);
  expect(state.project.datasets[12]).toBeDefined();
});

it('leaves a read only dataset, the samples split from it, and its tags and memos alone', async () => {
  const {isDeleted, state} = await deleteDataset(12, [12]);
  expect(isDeleted).toBe(false);
  expect(state.spot.spots).toEqual(familySpots);
  expect(state.project.datasets).toEqual(markReadOnly(splitDatasets, [12]));
  expect(state.project.project).toEqual({reports: [memo], tags: [tag]});
  expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('read only'), expect.anything());
});

it('won\'t delete a dataset when that would change a read only Spot filed elsewhere', async () => {
  const {isDeleted, state} = await deleteDataset(12, [13]);
  expect(isDeleted).toBe(false);
  expect(state.spot.spots).toEqual(familySpots);
  expect(state.project.datasets).toEqual(markReadOnly(splitDatasets, [13]));
  expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('Unable to delete Dataset 1'), expect.anything());
});

// A map open on the image basemap or strat section of a Spot that goes would be left with nothing holding it
describe('maps open on a deleted Spot', () => {
  const stratSectionSettings = {strat_section_id: 1756000000050};
  const mapHolder = {
    properties: {...parent.properties, images: [{id: 1756000000040}], sed: {strat_section: stratSectionSettings}},
    type: 'Feature',
  };
  // The image id as the server returns it, a string
  const imageBasemap = {id: '1756000000040'};

  const deleteDatasetWithMapOpen = async (map, spots = {...familySpots, [parentId]: mapHolder}) => {
    const {deleteDatasetApi, store} = renderDeleteDatasetApi([], {map: map, spots: spots});
    await ReactTestRenderer.act(async () => {
      await deleteDatasetApi.deleteDataset(splitDatasets[12]);
    });
    return store.getState().map;
  };

  it('closes an image basemap held by a Spot in the deleted dataset', async () => {
    expect((await deleteDatasetWithMapOpen({currentImageBasemap: imageBasemap})).currentImageBasemap).toBeUndefined();
  });

  it('closes a strat section held by a Spot in the deleted dataset', async () => {
    expect((await deleteDatasetWithMapOpen({stratSection: stratSectionSettings})).stratSection).toBeUndefined();
  });

  // The sample filed in the other dataset goes with its parent, so whatever it holds goes too
  it('closes an image basemap held by a sample deleted with the dataset', async () => {
    const sampleWithMap = {properties: {...sample.properties, images: [{id: 1756000000040}]}};
    const map = await deleteDatasetWithMapOpen({currentImageBasemap: imageBasemap},
      {...familySpots, [sampleId]: sampleWithMap});
    expect(map.currentImageBasemap).toBeUndefined();
  });

  it('leaves open an image basemap held by a Spot that stays', async () => {
    const map = await deleteDatasetWithMapOpen({currentImageBasemap: {id: 'other image'}});
    expect(map.currentImageBasemap).toEqual({id: 'other image'});
  });
});
