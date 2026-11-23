import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {ToastProvider} from 'react-native-toast-notifications';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import spotReducer from './spots.slice';
import useSpots from './useSpots';
import connectionsReducer from '../connections/connections.slice';
import homeReducer from '../home/home.slice';
import mapReducer from '../maps/maps.slice';
import projectReducer from '../project/projects.slice';
import {getSamplesSplitByDataset} from '../samples/samples.helpers';
import userReducer from '../user/userProfile.slice';

// A real toast keeps a timer running past the end of the test, and what matters here is only whether one was shown
const mockToastShow = jest.fn();
jest.mock('react-native-toast-notifications', () => ({
  ToastProvider: ({children}) => children,
  useToast: () => ({show: mockToastShow}),
}));

// A Spot's samples go with it, and deleting a sample changes its parent, so a read only dataset holding either one
// blocks the delete. They only sit apart if an old bug split them up.
describe('deleting with read only datasets', () => {
  const parentId = 1756000000011;
  const sampleId = 1756000000012;
  const parent = {properties: {id: parentId, name: 'Spot 08', samples: [{id: sampleId}]}, type: 'Feature'};
  const sample = {properties: {id: sampleId, isSample: true, name: 'Sample 1', samples: [{id: sampleId}]}};
  const familySpots = {[parentId]: parent, [sampleId]: sample};
  // The parent in one dataset and its sample in another, as only an old bug could leave them
  const splitDatasets = {12: {id: 12, spotIds: [parentId]}, 13: {id: 13, spotIds: [sampleId]}};

  beforeEach(() => mockToastShow.mockClear());

  const renderSpotsApi = (datasets, readOnlyDatasetsIds, spots = familySpots) => {
    const store = configureStore({
      preloadedState: {
        home: {activeModal: null, hiddenWarnings: {}, loading: {home: false}},
        map: {spotsInMapExtentIds: []},
        project: {
          activeDatasetsIds: Object.values(datasets).map(dataset => dataset.id),
          datasets: datasets,
          project: {reports: [], tags: []},
          readOnlyDatasetsIds: readOnlyDatasetsIds,
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
    let spotsApi;
    const Probe = () => {
      spotsApi = useSpots();
      return null;
    };
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
    });
    const deleteSpot = (spotToDelete) => {
      let isDeleted;
      ReactTestRenderer.act(() => {
        isDeleted = spotsApi.deleteSpot(spotToDelete);
      });
      return isDeleted;
    };
    return {deleteSpot: deleteSpot, getState: store.getState, spotsApi: spotsApi};
  };

  // As useDeleteDataset asks, with what getSamplesSplitByDataset found for the dataset
  const getSplit = (datasetId, datasets = splitDatasets) =>
    getSamplesSplitByDataset(splitDatasets[datasetId], familySpots, datasets);

  it('won\'t delete a Spot whose sample is in a read only dataset', () => {
    const {deleteSpot, getState, spotsApi} = renderSpotsApi(splitDatasets, [13]);
    expect(spotsApi.checkIsSafeDelete(parent)).toMatch(/Sample 1 is read only/);
    expect(deleteSpot(parent)).toBe(false);
    expect(Object.keys(getState().spot.spots)).toHaveLength(2);
    expect(getState().project.datasets).toEqual(splitDatasets);
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('Unable to delete'), expect.anything());
  });

  it('won\'t delete a sample whose parent is in a read only dataset', () => {
    const {deleteSpot, getState, spotsApi} = renderSpotsApi(splitDatasets, [12]);
    expect(spotsApi.checkIsSafeDelete(sample)).toMatch(/Spot 08, is read only/);
    expect(deleteSpot(sample)).toBe(false);
    expect(getState().spot.spots[sampleId]).toEqual(sample);
    expect(getState().project.datasets).toEqual(splitDatasets);
  });

  // The parent's own dataset is writable, but it sits on an image basemap held by a Spot in a read only one
  it('won\'t delete a sample whose parent is locked by the Spot holding its map', () => {
    const holderId = 1756000000021;
    const holder = {properties: {id: holderId, images: [{id: 'img1'}], name: 'Map Spot'}, type: 'Feature'};
    const parentOnMap = {...parent, properties: {...parent.properties, image_basemap: 'img1'}};
    const datasets = {12: {id: 12, spotIds: [parentId, sampleId]}, 14: {id: 14, spotIds: [holderId]}};
    const spots = {[holderId]: holder, [parentId]: parentOnMap, [sampleId]: sample};
    const {deleteSpot, getState, spotsApi} = renderSpotsApi(datasets, [14], spots);
    expect(spotsApi.checkIsSafeDelete(sample)).toMatch(/Spot 08, is read only/);
    expect(deleteSpot(sample)).toBe(false);
    expect(getState().spot.spots).toEqual(spots);
    expect(getState().project.datasets).toEqual(datasets);
  });

  // The old map-edit bug could leave a Spot in two datasets. Listed first, the writable one used to be the only one
  // asked, and deleting the Spot then took it out of the read only one too.
  it('won\'t delete a Spot that a read only dataset holds as well as a writable one', () => {
    const datasets = {12: {id: 12, spotIds: [parentId, sampleId]}, 13: {id: 13, spotIds: [parentId]}};
    const {deleteSpot, getState, spotsApi} = renderSpotsApi(datasets, [13]);
    expect(spotsApi.checkIsSafeDelete(parent)).toMatch(/It is read only/);
    expect(deleteSpot(parent)).toBe(false);
    expect(getState().spot.spots).toEqual(familySpots);
    expect(getState().project.datasets).toEqual(datasets);
  });

  // Deleting the parent's dataset deletes the sample filed elsewhere, as deleting the parent would
  it('deletes, after a dataset delete, the samples of its Spots filed elsewhere', () => {
    const {getState, spotsApi} = renderSpotsApi(splitDatasets, []);
    ReactTestRenderer.act(() => spotsApi.deleteSamplesSplitByDataset(getSplit(12)));
    expect(getState().spot.spots[sampleId]).toBeUndefined();
    expect(getState().project.datasets[13].spotIds).toEqual([]);
    expect(getState().spot.spots[parentId]).toEqual(parent);
  });

  // A parent in no dataset leaves its sample nowhere to move to, so deleting the sample's dataset takes its stub off
  // the parent, as deleting the sample would
  it('takes off, after a dataset delete, the stubs a parent in no dataset keeps for its samples', () => {
    const {getState, spotsApi} = renderSpotsApi(splitDatasets, []);
    ReactTestRenderer.act(() => spotsApi.deleteSamplesSplitByDataset(getSplit(13, {13: splitDatasets[13]})));
    expect(getState().spot.spots[parentId].properties.samples).toBeUndefined();
    expect(getState().project.datasets[12].spotIds).toEqual([parentId]);
  });

  it('deletes a Spot and its sample when nothing they are in is read only', () => {
    const datasets = {12: {id: 12, spotIds: [parentId, sampleId]}, 13: {id: 13, spotIds: []}};
    const {deleteSpot, getState, spotsApi} = renderSpotsApi(datasets, [13]);
    expect(spotsApi.checkIsSafeDelete(parent)).toBeNull();
    expect(deleteSpot(parent)).toBe(true);
    expect(getState().spot.spots).toEqual({});
    expect(getState().project.datasets[12].spotIds).toEqual([]);
  });
});

// discardSpot is a hook function rather than a reducer, so it is exercised through a probe component holding a
// real store - what matters is the state it leaves behind, not which actions it dispatched to get there.
describe('discardSpot', () => {
  const spotId = 1756000000001;
  const spot = {properties: {id: spotId, name: 'Spot 08'}, type: 'Feature'};
  const otherSpot = {properties: {id: 1756000000002, name: 'Spot 09'}, type: 'Feature'};

  const getPreloadedState = () => ({
    home: {hiddenWarnings: {}, loading: {home: false}, activeModal: null},
    map: {currentImageBasemap: undefined, spotsInMapExtentIds: [], stratSection: undefined},
    project: {
      activeDatasetsIds: [12],
      datasets: {12: {id: 12, modified_timestamp: 1, name: 'Dataset 1', spotIds: [spotId, otherSpot.properties.id]}},
      project: {
        modified_timestamp: 1,
        preferences: {spot_prefix: 'Spot ', starting_number_for_spot: 9},
        reports: [{id: 'r1', name: 'Report 1', spots: [spotId]}],
        tags: [{id: 't1', name: 'Tag 1', spots: [spotId], type: 'concept'}],
      },
      readOnlyDatasetsIds: [],
      selectedTag: {},
      targetDatasetId: 12,
    },
    spot: {
      intersectedSpotsForTagging: [],
      recentViews: [spotId],
      selectedAttributes: [],
      selectedSpot: spot,
      spots: {[spotId]: spot, [otherSpot.properties.id]: otherSpot},
    },
  });

  const discard = (spotToDiscard, spotNumberToRestore, preloadedState = getPreloadedState()) => {
    const store = configureStore({
      preloadedState: preloadedState,
      reducer: {
        connections: connectionsReducer,
        home: homeReducer,
        map: mapReducer,
        project: projectReducer,
        spot: spotReducer,
        user: userReducer,
      },
    });
    let spotsApi;
    const Probe = () => {
      spotsApi = useSpots();
      return null;
    };
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <Provider store={store}>
          <ToastProvider>
            <Probe/>
          </ToastProvider>
        </Provider>,
      );
    });
    ReactTestRenderer.act(() => spotsApi.discardSpot(spotToDiscard, spotNumberToRestore));
    return store.getState();
  };

  it('removes the Spot, leaving the others alone', () => {
    const state = discard(spot, 8);
    expect(state.spot.spots[spotId]).toBeUndefined();
    expect(state.spot.spots[otherSpot.properties.id]).toEqual(otherSpot);
  });

  it('takes the Spot out of its dataset', () => {
    const state = discard(spot, 8);
    expect(state.project.datasets[12].spotIds).toEqual([otherSpot.properties.id]);
  });

  // Continuous tagging attaches a new Spot to tags as it is created, so a discarded one has to be detached again
  it('unwinds the tags the Spot was attached to', () => {
    const state = discard(spot, 8);
    expect(state.project.project.tags[0].spots).toBeUndefined();
  });

  it('takes the Spot out of any report', () => {
    const state = discard(spot, 8);
    expect(state.project.project.reports[0].spots).toBeUndefined();
  });

  // The Spot took a number from the counter on the way in; cancelling has to give it back or numbering skips
  it('restores the Spot number the Spot had taken', () => {
    const state = discard(spot, 8);
    expect(state.project.project.preferences.starting_number_for_spot).toBe(8);
  });

  it('leaves the rest of the preferences alone', () => {
    const state = discard(spot, 8);
    expect(state.project.project.preferences.spot_prefix).toBe('Spot ');
  });

  // The first Spot of a project is numbered off the Spot count, with the preference still unset
  it('restores an unset Spot number to unset', () => {
    const state = discard(spot, undefined);
    expect(state.project.project.preferences.starting_number_for_spot).toBeUndefined();
  });

  it('clears the selected Spot, which would otherwise point at one that is gone', () => {
    const state = discard(spot, 8);
    expect(state.spot.selectedSpot).toEqual({});
  });

  it('takes the Spot out of the recently viewed list', () => {
    const state = discard(spot, 8);
    expect(state.spot.recentViews).not.toContain(spotId);
  });

  // A tag put on a measurement of the Spot rather than on the Spot itself is held under features, not spots
  it('unwinds a feature-level tag, dropping features once nothing is left in it', () => {
    const preloadedState = getPreloadedState();
    preloadedState.project.project.tags = [{features: {[spotId]: ['m1']}, id: 't1', name: 'Tag 1', type: 'concept'}];
    const state = discard(spot, 8, preloadedState);
    expect(state.project.project.tags[0].features).toBeUndefined();
  });

  // Without a target dataset nothing is filed anywhere, so there may be no references to take back
  it('discards a Spot that is in no dataset, tag or report', () => {
    const preloadedState = getPreloadedState();
    preloadedState.project.datasets = {};
    preloadedState.project.project.reports = undefined;
    preloadedState.project.project.tags = [];
    const state = discard(spot, 8, preloadedState);
    expect(state.spot.spots[spotId]).toBeUndefined();
    expect(state.project.project.preferences.starting_number_for_spot).toBe(8);
  });
});
