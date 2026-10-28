import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import * as turf from '@turf/turf';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useMapEditor from './useMapEditor';
import projectReducer from '../../project/projects.slice';
import spotReducer from '../../spots/spots.slice';
import {MAP_MODES} from '../maps.constants';
import mapReducer from '../maps.slice';

jest.mock('./useMapDisplayedSpots', () => () => ({setDisplayedSpots: () => {}, setDisplayedSpotsWhileEditing: () => {}}));
jest.mock('./useMapDraw', () => () => ({drawFeatures: [], setDrawFeatures: () => {}}));
// Spot 1 is already in a dataset, and Spot 2 is a new Spot with no dataset on record
jest.mock('./useMapEditVertex', () => () => ({
  clearEditing: () => {},
  spotEditing: {},
  spotsEdited: [1, 2].map(id => mockTurf.point([-105, 40], {id: id})),
}));
jest.mock('./useMapSelectionModes', () => () => ({}));
jest.mock('../features/useMapFeaturesCalculated', () => () => ({}));
jest.mock('../../project/useProject', () => () => ({
  getDatasetIdFromSpotId: spotId => Object.values(mockState.project.datasets)
    .find(dataset => dataset.spotIds.includes(spotId))?.id,
  getTargetDatasetFromId: () => mockState.project.datasets.target,
}));

// jest.mock factories may only read variables prefixed with mock
const mockTurf = turf;
const mockState = {
  project: {
    datasets: {
      original: {id: 'original', modified_timestamp: 0, spotIds: [1]},
      target: {id: 'target', modified_timestamp: 0, spotIds: []},
    },
    project: {modified_timestamp: 0},
  },
};

// Saving geometry never copies a Spot into the target dataset. Only a new Spot with no dataset on record goes there.
describe('saveEdits', () => {
  it('leaves an edited Spot in its dataset', () => {
    const store = configureStore({
      preloadedState: mockState,
      reducer: {map: mapReducer, project: projectReducer, spot: spotReducer},
    });
    let hookApi;
    const Probe = () => {
      hookApi = useMapEditor({mapMode: MAP_MODES.EDIT, mapRef: {current: null}});
      return null;
    };
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
    });
    ReactTestRenderer.act(() => hookApi.saveEdits());

    const {datasets} = store.getState().project;
    expect(datasets.original.spotIds).toEqual([1]);
    expect(datasets.target.spotIds).toEqual([2]);
    expect(Object.keys(store.getState().spot.spots)).toEqual(['1', '2']);
  });
});
