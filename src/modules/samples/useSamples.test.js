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
const renderSamplesApi = ({datasets, readOnlyDatasetsIds, spots}) => {
  const store = configureStore({
    preloadedState: {
      home: {activeModal: null, hiddenWarnings: {}, loading: {home: false}},
      map: {spotsInMapExtentIds: []},
      project: {
        activeDatasetsIds: [12, 13],
        datasets: datasets,
        project: {reports: [], tags: []},
        readOnlyDatasetsIds: readOnlyDatasetsIds,
        sampleSpotIdsToUpload: [],
        selectedTag: {},
        targetDatasetId: 13,
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
  const createRichSample = ({parentSpot = parent} = {}) => {
    const {samplesApi, store} = renderSamplesApi({
      datasets: {
        12: {id: 12, name: 'Dataset 1', spotIds: [parentId]},
        13: {id: 13, name: 'Dataset 2', spotIds: []},
      },
      readOnlyDatasetsIds: [],
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
});
