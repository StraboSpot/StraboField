import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import * as turf from '@turf/turf';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useMapFeatures from './useMapFeatures';
import mapReducer from '../maps.slice';

jest.mock('../../spots/useSpots', () => () => ({
  getMappableSpots: () => [mockParentSpot, mockOtherSpot],
  getSpotWithThisSample: sampleId => (sampleId === mockSampleSpot.properties.id ? mockParentSpot : undefined),
}));

// jest.mock factories may only read variables prefixed with mock
const mockParentSpot = turf.point([-105, 40], {id: 1, samples: [{id: 3}]});
const mockOtherSpot = turf.point([-104, 41], {id: 2});
const mockSampleSpot = turf.point([-105, 40], {id: 3, isSample: true});

const renderHook = () => {
  const store = configureStore({reducer: {map: mapReducer}});
  let hookApi;
  const Probe = () => {
    hookApi = useMapFeatures();
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
  });
  return hookApi;
};

// The map draws no Sample Spots, so a selected one would leave nothing looking selected. Its parent stands in for it.
describe('getDisplayedSpots', () => {
  it('shows the parent of a selected Sample Spot as selected', () => {
    const [selected, notSelected] = renderHook().getDisplayedSpots([mockSampleSpot]);
    expect(selected).toEqual([mockParentSpot]);
    expect(notSelected).toEqual([mockOtherSpot]);
  });

  it('shows a selected Spot as selected', () => {
    const [selected, notSelected] = renderHook().getDisplayedSpots([mockOtherSpot]);
    expect(selected).toEqual([mockOtherSpot]);
    expect(notSelected).toEqual([mockParentSpot]);
  });
});
