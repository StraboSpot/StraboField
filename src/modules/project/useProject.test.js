import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import projectReducer from './projects.slice';
import useProject from './useProject';
import connectionsReducer from '../connections/connections.slice';
import homeReducer from '../home/home.slice';
import mapReducer from '../maps/maps.slice';
import spotReducer from '../spots/spots.slice';
import userReducer from '../user/userProfile.slice';

// A real toast keeps a timer running past the end of the test, and what matters here is only whether one was shown
const mockToastShow = jest.fn();
jest.mock('react-native-toast-notifications', () => ({useToast: () => ({show: mockToastShow})}));

const spotId = 1756000000001;
const spot = {properties: {id: spotId, name: 'Spot 08'}, type: 'Feature'};

beforeEach(() => mockToastShow.mockClear());

// The hook's functions are exercised through a probe component holding a real store - what matters is the state
// they leave behind, not which actions they dispatched to get there.
const renderProjectApi = ({project, spot: spotState}) => {
  const store = configureStore({
    preloadedState: {home: {activeModal: null, loading: {}}, map: {}, project: project, spot: spotState},
    reducer: {
      connections: connectionsReducer,
      home: homeReducer,
      map: mapReducer,
      project: projectReducer,
      spot: spotReducer,
      user: userReducer,
    },
  });
  let projectApi;
  const Probe = () => {
    projectApi = useProject();
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
  });
  return {projectApi: projectApi, store: store};
};

// Nothing in a read only dataset may change, so it can't be deleted - whichever way the delete arrives
describe('destroyDataset', () => {
  const destroyDataset = async (readOnlyDatasetsIds) => {
    const {projectApi, store} = renderProjectApi({
      project: {
        activeDatasetsIds: [12],
        datasets: {12: {id: 12, name: 'Dataset 1', spotIds: [spotId]}},
        project: {},
        readOnlyDatasetsIds: readOnlyDatasetsIds,
      },
      spot: {recentViews: [], selectedSpot: {}, spots: {[spotId]: spot}},
    });
    let isDeleted;
    await ReactTestRenderer.act(async () => {
      isDeleted = await projectApi.destroyDataset(12);
    });
    return {isDeleted: isDeleted, state: store.getState()};
  };

  // The caller tidies up around the dataset only once it is gone, so it is told whether it is
  it('deletes a writable dataset and its Spots, and says so', async () => {
    const {isDeleted, state} = await destroyDataset([]);
    expect(isDeleted).toBe(true);
    expect(state.project.datasets[12]).toBeUndefined();
    expect(state.spot.spots[spotId]).toBeUndefined();
  });

  it('leaves a read only dataset and its Spots alone, and says why', async () => {
    const {isDeleted, state} = await destroyDataset([12]);
    expect(isDeleted).toBe(false);
    expect(state.project.datasets[12].spotIds).toEqual([spotId]);
    expect(state.spot.spots[spotId]).toEqual(spot);
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('read only'), expect.anything());
  });
});

// A dataset id can be held as a string, as after a download, and must still be known for the same dataset
describe('toggleActiveDataset', () => {
  const dataset = {id: 12, name: 'Dataset 1', spotIds: [spotId.toString()]};

  const turnOffDataset = async () => {
    const {projectApi, store} = renderProjectApi({
      project: {
        activeDatasetsIds: [12, 13],
        datasets: {12: dataset, 13: {id: 13, name: 'Dataset 2', spotIds: []}},
        project: {},
        readOnlyDatasetsIds: [],
        targetDatasetId: '12',
      },
      spot: {recentViews: [], selectedSpot: spot, spots: {[spotId]: spot}},
    });
    await ReactTestRenderer.act(() => projectApi.toggleActiveDataset(false, dataset));
    return store.getState();
  };

  // Otherwise new Spots go on into a dataset that isn't shown
  it('clears the target when it is the dataset turned off', async () => {
    const state = await turnOffDataset();
    expect(state.project.targetDatasetId).toBeUndefined();
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('cleared the target'), expect.anything());
  });

  it('deselects a selected Spot in the dataset turned off', async () => {
    const state = await turnOffDataset();
    expect(state.spot.selectedSpot).toEqual({});
  });
});
