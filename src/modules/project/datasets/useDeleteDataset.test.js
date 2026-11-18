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

beforeEach(() => mockToastShow.mockClear());

const renderDeleteDatasetApi = (readOnlyDatasetsIds) => {
  const store = configureStore({
    preloadedState: {
      home: {activeModal: null, hiddenWarnings: {}, loading: {home: false}},
      map: {spotsInMapExtentIds: []},
      project: {
        activeDatasetsIds: [12, 13],
        datasets: splitDatasets,
        project: {reports: [memo], tags: [tag]},
        readOnlyDatasetsIds: readOnlyDatasetsIds,
        selectedTag: {},
      },
      spot: {recentViews: [], selectedAttributes: [], selectedSpot: {}, spots: familySpots},
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
const deleteDataset = (datasetId, readOnlyDatasetsIds, dataset = splitDatasets[datasetId]) => {
  const {deleteDatasetApi, store} = renderDeleteDatasetApi(readOnlyDatasetsIds);
  let isDeleted;
  ReactTestRenderer.act(() => {
    isDeleted = deleteDatasetApi.deleteDataset(dataset);
  });
  return {isDeleted: isDeleted, state: store.getState()};
};

const getDatasetDeleteCheck = (datasetId, readOnlyDatasetsIds) =>
  renderDeleteDatasetApi(readOnlyDatasetsIds).deleteDatasetApi.getDatasetDeleteCheck(splitDatasets[datasetId]);

// What the confirmation names, worked out before anything is deleted
it('names the samples a delete would take from other datasets, and the parents it would unlink', () => {
  expect(getDatasetDeleteCheck(12, [])).toEqual({parentsToUnlink: [], readOnlyMessage: null, samplesToDelete: [sample]});
  expect(getDatasetDeleteCheck(13, [])).toEqual({
    parentsToUnlink: [{parentSpot: parent, sampleIds: [sampleId]}],
    readOnlyMessage: null,
    samplesToDelete: [],
  });
});

it('says why a dataset whose Spot has a read only sample filed elsewhere can\'t be deleted', () => {
  expect(getDatasetDeleteCheck(12, [13]).readOnlyMessage).toMatch(/Sample Sample 1, .* is read only/);
});

it('says why a dataset holding a sample whose read only parent is filed elsewhere can\'t be deleted', () => {
  expect(getDatasetDeleteCheck(13, [12]).readOnlyMessage).toMatch(/Spot Spot 08, .* is read only/);
});

// Deleting the parent's dataset deletes the sample filed elsewhere, as deleting the parent would
it('deletes a dataset together with the samples of its Spots filed elsewhere', () => {
  const {isDeleted, state} = deleteDataset(12, []);
  expect(isDeleted).toBe(true);
  expect(state.project.datasets[12]).toBeUndefined();
  expect(state.spot.spots).toEqual({});
  expect(state.project.datasets[13].spotIds).toEqual([]);
});

// The page's copy was taken before the parent was filed in the dataset, so only the store's knows of it and its sample
it('deletes the samples of the Spots the dataset holds now, not when its page opened', () => {
  const {isDeleted, state} = deleteDataset(12, [], {...splitDatasets[12], spotIds: []});
  expect(isDeleted).toBe(true);
  expect(state.spot.spots).toEqual({});
  expect(state.project.datasets[13].spotIds).toEqual([]);
});

// They used to be left there, pointing at Spots that were gone
it('takes the dataset\'s Spots out of the tags and memos holding them', () => {
  const {state} = deleteDataset(12, []);
  expect(state.project.project.tags[0].spots).toEqual([otherSpotId]);
  expect(state.project.project.reports[0].spots).toEqual([otherSpotId]);
});

// Deleting the sample's dataset takes its stub off the parent, as deleting the sample would
it('deletes a dataset and takes off the stubs a parent filed elsewhere keeps for its samples', () => {
  const {isDeleted, state} = deleteDataset(13, []);
  expect(isDeleted).toBe(true);
  expect(state.project.datasets[13]).toBeUndefined();
  expect(state.spot.spots[sampleId]).toBeUndefined();
  expect(state.spot.spots[parentId].properties.samples).toBeUndefined();
  expect(state.project.datasets[12].spotIds).toEqual([parentId]);
});

it('leaves a read only dataset, the samples split from it, and its tags and memos alone', () => {
  const {isDeleted, state} = deleteDataset(12, [12]);
  expect(isDeleted).toBe(false);
  expect(state.spot.spots).toEqual(familySpots);
  expect(state.project.datasets).toEqual(splitDatasets);
  expect(state.project.project).toEqual({reports: [memo], tags: [tag]});
  expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('read only'), expect.anything());
});

it('won\'t delete a dataset when that would change a read only Spot filed elsewhere', () => {
  const {isDeleted, state} = deleteDataset(12, [13]);
  expect(isDeleted).toBe(false);
  expect(state.spot.spots).toEqual(familySpots);
  expect(state.project.datasets).toEqual(splitDatasets);
  expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('Unable to delete Dataset 1'), expect.anything());
});
