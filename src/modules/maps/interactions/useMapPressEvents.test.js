import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import * as turf from '@turf/turf';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useMapPressEvents from './useMapPressEvents';
import {LeavePageContext} from '../../notebook-panel/LeavePageContext';
import projectReducer from '../../project/projects.slice';
import spotReducer from '../../spots/spots.slice';
import {MAP_MODES} from '../maps.constants';
import mapReducer from '../maps.slice';

jest.mock('../../project/useProject', () => () => ({isReadOnlyDataset: () => false}));
jest.mock('../../spots/useSpots', () => () => ({}));
jest.mock('../features/useMapFeatures', () => () => ({getAllMappedSpots: () => []}));
jest.mock('../features/useMapFeaturesCalculated', () => () => ({
  getDrawFeatureAtPress: async () => ({}),
  getSpotsAtPress: async () => mockSpotsAtPress,
}));
jest.mock('../useMap', () => () => ({isDrawMode: () => false}));
jest.mock('../useMapMeasure', () => () => ({}));

// jest.mock factories may only read variables prefixed with mock
let mockSpotsAtPress = [];

const editedSpot = turf.lineString([[-105, 40], [-104, 41]], {id: 1});
const otherSpot = turf.point([-105, 40], {id: 2});
const press = {properties: {screenPointX: 100, screenPointY: 200}};

// The Spot being edited is selected, with its edit copy's geometry. Stored without geometry, it is a Spot given its
// first geometry by Set in Current View.
const renderHook = ({isNewGeometry}) => {
  const storedSpot = isNewGeometry ? {...editedSpot, geometry: undefined} : editedSpot;
  const store = configureStore({
    preloadedState: {spot: {...spotReducer(undefined, {type: ''}), selectedSpot: editedSpot, spots: {1: storedSpot}}},
    reducer: {map: mapReducer, project: projectReducer, spot: spotReducer},
  });
  const handlers = {editSpot: jest.fn(), onCancel: jest.fn(), setSpotToEditFromPicker: jest.fn()};
  let hookApi;
  const Probe = () => {
    hookApi = useMapPressEvents({
      ...handlers,
      getEditSession: () => 0,
      isEditingSpot: true,
      mapMode: MAP_MODES.EDIT,
      mapRef: {current: null},
    });
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <Provider store={store}>
        <LeavePageContext.Provider value={{confirmLeavePage: async () => true, hasUnsavedPageChanges: () => false}}>
          <Probe/>
        </LeavePageContext.Provider>
      </Provider>,
    );
  });
  const pressMap = spotsAtPress => ReactTestRenderer.act(async () => {
    mockSpotsAtPress = spotsAtPress;
    await hookApi.handleMapPress(press);
  });
  return {handlers, pressMap};
};

// Set in Current View's geometry is the whole edit, so pressing off it ends the edit the way Cancel does
describe('handleMapPress in edit mode', () => {
  it('cancels a new geometry on a press on empty map', async () => {
    const {handlers, pressMap} = renderHook({isNewGeometry: true});
    await pressMap([]);
    expect(handlers.onCancel).toHaveBeenCalled();
    expect(handlers.editSpot).not.toHaveBeenCalled();
  });

  it('cancels a new geometry on a press on another Spot', async () => {
    const {handlers, pressMap} = renderHook({isNewGeometry: true});
    await pressMap([otherSpot]);
    expect(handlers.onCancel).toHaveBeenCalled();
    expect(handlers.setSpotToEditFromPicker).not.toHaveBeenCalled();
  });

  it('keeps a new geometry on a press on it', async () => {
    const {handlers, pressMap} = renderHook({isNewGeometry: true});
    await pressMap([editedSpot]);
    expect(handlers.onCancel).not.toHaveBeenCalled();
  });

  it('only deselects a Spot that already had geometry on a press on empty map', async () => {
    const {handlers, pressMap} = renderHook({isNewGeometry: false});
    await pressMap([]);
    expect(handlers.onCancel).not.toHaveBeenCalled();
    expect(handlers.editSpot).toHaveBeenCalled();
  });
});
