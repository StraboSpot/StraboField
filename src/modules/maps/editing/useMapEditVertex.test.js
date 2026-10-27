import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import * as turf from '@turf/turf';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useMapEditVertex from './useMapEditVertex';
import spotReducer from '../../spots/spots.slice';
import {MAP_MODES} from '../maps.constants';
import mapReducer from '../maps.slice';

jest.mock('../useMap', () => () => ({isDrawMode: () => false}));
jest.mock('../view/useMapCoords', () => () => ({}));
jest.mock('../features/useMapFeatures', () => () => ({getAllMappedSpots: () => []}));
jest.mock('../../project/useProject', () => () => ({isSpotInReadOnlyDataset: () => false}));
jest.mock('./useMapSnap', () => () => ({snapCoord: (screenPoint, coord) => coord}));

const renderHook = () => {
  let resolvePointInView;
  const mapRef = {
    current: {getPointInView: () => new Promise((resolve) => { resolvePointInView = resolve; })},
  };
  const store = configureStore({reducer: {map: mapReducer, spot: spotReducer}});
  let hookApi;
  const Probe = () => {
    hookApi = useMapEditVertex({
      drawFeatures: [],
      mapMode: MAP_MODES.EDIT,
      mapRef: mapRef,
      setDisplayedSpotsWhileEditing: () => {},
      setDrawFeatures: () => {},
      spotsSelected: [],
    });
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
  });
  // Starts selecting a vertex, runs whatever happens while the map is still answering, then answers
  const selectVertex = async (whileWaiting = () => {}) => {
    let selecting;
    ReactTestRenderer.act(() => {
      selecting = hookApi.setSelectedVertexToEdit(turf.point([-105, 40]));
    });
    ReactTestRenderer.act(whileWaiting);
    await ReactTestRenderer.act(async () => {
      resolvePointInView([100, 200]);
      await selecting;
    });
  };
  return {getHookApi: () => hookApi, selectVertex, store};
};

// Selecting a vertex awaits the map for its screen position. If Save or Cancel ended the edit in the meantime,
// the selection must be dropped, or the drag marker is put back on a finished edit and stays on the map.
describe('setSelectedVertexToEdit', () => {
  it('places the drag marker when the edit is still going', async () => {
    const {selectVertex, store} = renderHook();
    await selectVertex();
    expect(store.getState().map.vertexStartCoords).toEqual([100, 200]);
  });

  it('drops the selection when the edit ended while it waited', async () => {
    const {getHookApi, selectVertex, store} = renderHook();
    await selectVertex(() => getHookApi().clearEditing());
    expect(store.getState().map.vertexStartCoords).toBeUndefined();
    expect(getHookApi().editFeatureVertex).toEqual([]);
  });
});

// Set in Current View gives a Spot its first geometry inside an edit, so the Spot counts as edited from the start and
// only Save writes the geometry. Cancel puts back the store's copy, which has none.
describe('startEditing', () => {
  const spot = turf.lineString([[-105, 40], [-104, 41]], {id: 1});

  const startEditing = (getHookApi, isNewGeometry) => ReactTestRenderer.act(() => {
    getHookApi().startEditing(spot, undefined, undefined, () => {}, isNewGeometry);
  });

  it('counts a Spot given new geometry as edited', () => {
    const {getHookApi, store} = renderHook();
    startEditing(getHookApi, true);
    expect(getHookApi().spotsEdited).toEqual([spot]);
    expect(store.getState().spot.spots).toEqual({});
  });

  it('counts a Spot opened for editing as unchanged', () => {
    const {getHookApi} = renderHook();
    startEditing(getHookApi, false);
    expect(getHookApi().spotsEdited).toEqual([]);
  });
});
