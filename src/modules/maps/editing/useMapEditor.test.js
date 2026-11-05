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
// Spot 1 is a copy given its first geometry, Spot 2 the new half of line 3, and Spot 4 a new Spot with no dataset on
// record
jest.mock('./useMapEditVertex', () => () => ({
  clearEditing: () => {},
  getSplitLineDatasetId: spotId => (spotId === 2 ? 'lineIn' : undefined),
  spotEditing: {},
  spotsEdited: [1, 2, 3, 4].map(id => mockTurf.point([-105, 40], {id: id})),
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
      copiedTo: {id: 'copiedTo', modified_timestamp: 0, spotIds: [1]},
      lineIn: {id: 'lineIn', modified_timestamp: 0, spotIds: [3]},
      target: {id: 'target', modified_timestamp: 0, spotIds: []},
    },
    project: {modified_timestamp: 0},
  },
};

// Saving geometry never moves a Spot to the target dataset. A split line's new half goes in with its line, and only a
// new Spot with no dataset on record falls back to the target.
describe('saveEdits', () => {
  it('leaves every Spot in its dataset and files a split half with its line', () => {
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
    expect(datasets.copiedTo.spotIds).toEqual([1]);
    expect(datasets.lineIn.spotIds).toEqual([3, 2]);
    expect(datasets.target.spotIds).toEqual([4]);
    expect(Object.keys(store.getState().spot.spots)).toEqual(['1', '2', '3', '4']);
  });
});
