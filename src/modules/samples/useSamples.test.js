import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useSamples from './useSamples';
import connectionsReducer from '../connections/connections.slice';
import homeReducer from '../home/home.slice';
import mapReducer from '../maps/maps.slice';
import projectReducer from '../project/projects.slice';
import spotReducer from '../spots/spots.slice';
import userReducer from '../user/userProfile.slice';

// A real toast keeps a timer running past the end of the test, and what matters here is only whether one was shown
const mockToastShow = jest.fn();
jest.mock('react-native-toast-notifications', () => ({useToast: () => ({show: mockToastShow})}));

const parentId = 1756000000001;
const sampleId = 1756000000002;
const parent = {
  geometry: {coordinates: [-105, 40], type: 'Point'},
  properties: {id: parentId, name: 'Spot 08'},
  type: 'Feature',
};
const sample = {id: sampleId, sample_id_name: 'Sample 1'};

beforeEach(() => mockToastShow.mockClear());

// The hook's functions are exercised through a probe component holding a real store - what matters is the state
// they leave behind, not which actions they dispatched to get there.
// The datasets with those ids marked read only, as the server marks them
const markReadOnly = (datasets, readOnlyDatasetsIds) => Object.fromEntries(Object.entries(datasets).map(
  ([id, dataset]) => [id, readOnlyDatasetsIds.includes(dataset.id) ? {...dataset, isReadOnly: true} : dataset]));

const renderSamplesApi = ({datasets, readOnlyDatasetsIds = [], selectedAttributes = [], selectedSpot = {}, spots, tags = []}) => {
  const store = configureStore({
    preloadedState: {
      home: {activeModal: null, hiddenWarnings: {}, loading: {home: false}},
      map: {spotsInMapExtentIds: []},
      project: {
        activeDatasetsIds: [12, 13],
        datasets: markReadOnly(datasets, readOnlyDatasetsIds),
        project: {reports: [], tags: tags},
        sampleSpotIdsToUpload: [],
        selectedTag: {},
        targetDatasetId: 13,
      },
      spot: {recentViews: [], selectedAttributes: selectedAttributes, selectedSpot: selectedSpot, spots: spots},
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
  let samplesApi;
  const Probe = () => {
    samplesApi = useSamples();
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <Provider store={store}>
        <Probe/>
      </Provider>,
    );
  });
  return {samplesApi: samplesApi, store: store};
};

describe('createRichSample', () => {
  const createRichSample = ({parentSpot = parent, readOnlyDatasetsIds = []} = {}) => {
    const {samplesApi, store} = renderSamplesApi({
      datasets: {
        12: {id: 12, name: 'Dataset 1', spotIds: [parentId]},
        13: {id: 13, name: 'Dataset 2', spotIds: []},
      },
      readOnlyDatasetsIds: readOnlyDatasetsIds,
      spots: {[parentId]: parentSpot},
    });
    let sampleSpot;
    ReactTestRenderer.act(() => {
      sampleSpot = samplesApi.createRichSample(parentSpot, sample);
    });
    return {sampleSpot: sampleSpot, state: store.getState()};
  };

  // Not the target: the target may have been switched since the parent was made
  it('files the Sample Spot in its parent\'s dataset', () => {
    const {sampleSpot, state} = createRichSample();
    expect(sampleSpot.properties.id).toBe(sampleId);
    expect(state.spot.spots[sampleId]).toBeDefined();
    expect(state.project.datasets[12].spotIds).toEqual([parentId, sampleId]);
    expect(state.project.datasets[13].spotIds).toEqual([]);
  });

  // A legacy sample is one kept whole on its parent Spot. Converting it promotes it to a Sample Spot of its own,
  // which belongs in the parent's dataset like any other, while the parent keeps only an {id} stub for it.
  it('files a converted legacy sample in its parent\'s dataset, leaving the parent a stub', () => {
    const parentWithLegacySample = {
      ...parent,
      properties: {...parent.properties, date: '2024-05-01T10:00:00.000Z', samples: [sample]},
    };
    const {sampleSpot, state} = createRichSample({parentSpot: parentWithLegacySample});
    expect(state.project.datasets[12].spotIds).toEqual([parentId, sampleId]);
    expect(state.project.datasets[13].spotIds).toEqual([]);
    expect(state.spot.spots[parentId].properties.samples).toEqual([{id: sampleId}]);
    expect(state.spot.spots[sampleId].properties.samples).toEqual([sample]);
    // Taken when the parent was, so it keeps the parent's created date
    expect(sampleSpot.properties.date).toBe('2024-05-01T10:00:00.000Z');
  });

  it('leaves a legacy sample on a Spot in a read only dataset as it is', () => {
    const parentWithLegacySample = {...parent, properties: {...parent.properties, samples: [sample]}};
    const {sampleSpot, state} = createRichSample({parentSpot: parentWithLegacySample, readOnlyDatasetsIds: [12]});
    expect(sampleSpot).toBeUndefined();
    expect(state.spot.spots[sampleId]).toBeUndefined();
    expect(state.spot.spots[parentId].properties.samples).toEqual([sample]);
    expect(state.project.datasets[12].spotIds).toEqual([parentId]);
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('read only'), expect.anything());
  });

  it('creates nothing for a Spot in a read only dataset', () => {
    const {sampleSpot, state} = createRichSample({readOnlyDatasetsIds: [12]});
    expect(sampleSpot).toBeUndefined();
    expect(state.spot.spots[sampleId]).toBeUndefined();
    expect(state.project.datasets[12].spotIds).toEqual([parentId]);
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('read only'), expect.anything());
  });

  // A Sample Spot missing its own record once had the Samples modal opened for it, which nested a new Sample under it
  it('creates nothing under a Sample Spot', () => {
    const emptySampleSpot = {...parent, properties: {...parent.properties, isSample: true, samples: []}};
    const {sampleSpot, state} = createRichSample({parentSpot: emptySampleSpot});
    expect(sampleSpot).toBeUndefined();
    expect(state.spot.spots[sampleId]).toBeUndefined();
    expect(state.spot.spots[parentId]).toEqual(emptySampleSpot);
    expect(state.project.datasets[12].spotIds).toEqual([parentId]);
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('another Sample'), expect.anything());
  });
});

// A legacy sample is a record kept whole on its Spot, so deleting it must leave the Spot, as the sample's own page does
describe('deleteLegacySample', () => {
  const otherSample = {id: 1756000000003, sample_id_name: 'Sample 2'};
  const parentWithSamples = {...parent, properties: {...parent.properties, samples: [sample, otherSample]}};
  const tag = {features: {[parentId]: [sampleId]}, id: 't1', name: 'Tag 1', spots: [parentId]};

  const deleteLegacySample = (readOnlyDatasetsIds = []) => {
    const {samplesApi, store} = renderSamplesApi({
      datasets: {12: {id: 12, spotIds: [parentId]}},
      readOnlyDatasetsIds: readOnlyDatasetsIds,
      selectedAttributes: [sample],
      selectedSpot: parentWithSamples,
      spots: {[parentId]: parentWithSamples},
      tags: [tag],
    });
    ReactTestRenderer.act(() => samplesApi.deleteLegacySample(sample));
    return store.getState();
  };

  it('takes only the sample out of its Spot, and its tags with it', () => {
    const state = deleteLegacySample();
    expect(state.spot.spots[parentId].properties.samples).toEqual([otherSample]);
    expect(state.spot.spots[parentId].properties.name).toBe('Spot 08');
    expect(state.project.datasets[12].spotIds).toEqual([parentId]);
    expect(state.project.project.tags[0].features).toBeUndefined();
    expect(state.spot.selectedAttributes).toEqual([]);
  });

  it('leaves the sample on a Spot in a read only dataset', () => {
    const state = deleteLegacySample([12]);
    expect(state.spot.spots[parentId]).toEqual(parentWithSamples);
    expect(state.project.project.tags).toEqual([tag]);
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('read only'), expect.anything());
  });
});

// Deleting a sample takes its stub off its parent, so the parent's dataset is changed as well as the sample's
describe('deleteRichSample', () => {
  const parentWithStub = {...parent, properties: {...parent.properties, samples: [{id: sampleId}]}};
  const sampleSpot = {properties: {id: sampleId, isSample: true, name: 'Sample 1', samples: [sample]}};
  const spots = {[parentId]: parentWithStub, [sampleId]: sampleSpot};

  const deleteRichSample = (datasets, readOnlyDatasetsIds, spotsOnDevice = spots, sampleToDelete = sampleSpot) => {
    const {samplesApi, store} = renderSamplesApi({datasets, readOnlyDatasetsIds, spots: spotsOnDevice});
    ReactTestRenderer.act(() => samplesApi.deleteRichSample(sampleToDelete));
    return store.getState();
  };

  // A sample of a sample: its parent is a Sample Spot, listing it alongside itself, and keeps only its own stub
  it('takes a nested sample\'s stub off its parent sample', () => {
    const nestedId = 1756000000014;
    const sampleWithNested = {
      properties: {...sampleSpot.properties, samples: [{id: sampleId}, {id: nestedId.toString()}]},
    };
    const nested = {properties: {id: nestedId, isSample: true, name: 'Sample 1a', samples: [{id: nestedId}]}};
    const spotsOnDevice = {...spots, [sampleId]: sampleWithNested, [nestedId]: nested};
    const datasets = {12: {id: 12, spotIds: [parentId, sampleId, nestedId]}};
    const state = deleteRichSample(datasets, [], spotsOnDevice, nested);
    expect(state.spot.spots[nestedId]).toBeUndefined();
    expect(state.spot.spots[sampleId].properties.samples).toEqual([{id: sampleId}]);
  });

  it('deletes the sample and takes its stub off the parent', () => {
    const state = deleteRichSample({12: {id: 12, spotIds: [parentId, sampleId]}, 13: {id: 13, spotIds: []}}, []);
    expect(state.spot.spots[sampleId]).toBeUndefined();
    expect(state.spot.spots[parentId].properties.samples).toBeUndefined();
    expect(state.project.datasets[12].spotIds).toEqual([parentId]);
  });

  // A stub can hold its id as a string. It is taken off all the same, so Undo has to put it back.
  it('restores the parent\'s link on Undo when its stub holds the id as a string', () => {
    const parentWithStringStub = {...parent, properties: {...parent.properties, samples: [{id: sampleId.toString()}]}};
    const spotsOnDevice = {[parentId]: parentWithStringStub, [sampleId]: sampleSpot};
    const {samplesApi, store} = renderSamplesApi(
      {datasets: {12: {id: 12, spotIds: [parentId, sampleId]}}, readOnlyDatasetsIds: [], spots: spotsOnDevice});
    ReactTestRenderer.act(() => samplesApi.deleteRichSample(sampleSpot));
    expect(store.getState().spot.spots[parentId].properties.samples).toBeUndefined();
    const [, {data}] = mockToastShow.mock.calls.find(([, options]) => options?.data?.onUndo);
    ReactTestRenderer.act(() => data.onUndo());
    const restoredSpots = store.getState().spot.spots;
    expect(restoredSpots[sampleId]).toBeDefined();
    expect(restoredSpots[parentId].properties.samples).toEqual([{id: sampleId.toString()}]);
  });

  // Only possible where an old bug split the sample off from its parent
  it('leaves both alone when the parent is in a read only dataset', () => {
    const datasets = {12: {id: 12, spotIds: [parentId]}, 13: {id: 13, spotIds: [sampleId]}};
    const state = deleteRichSample(datasets, [12]);
    expect(state.spot.spots).toEqual(spots);
    expect(state.project.datasets).toEqual(markReadOnly(datasets, [12]));
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('Unable to delete'), expect.anything());
  });
});
