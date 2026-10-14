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

// Selecting a vertex awaits the map for its screen position. If Save or Cancel ended the edit in the meantime,
// the selection must be dropped, or the drag marker is put back on a finished edit and stays on the map.
describe('setSelectedVertexToEdit', () => {
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
