import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useMapMoveEvents from './useMapMoveEvents';
import mapReducer from '../maps.slice';

jest.mock('../view/useMapView', () => () => ({setMapView: mockSetMapView}));

// jest.mock factories may only read variables prefixed with mock
const mockSetMapView = jest.fn();

const center = [-105, 40];
const moved = {timestamp: 5000};

const renderHook = (mapRef) => {
  const store = configureStore({reducer: {map: mapReducer}});
  let hookApi;
  const Probe = () => {
    hookApi = useMapMoveEvents({mapRef});
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
  });
  return hookApi;
};

describe('useMapMoveEvents', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSetMapView.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('saves the view the map reports', async () => {
    const mapRef = {current: {getCenter: async () => center, getZoom: async () => 12}};
    await renderHook(mapRef).handleMapMoved(moved);
    expect(mockSetMapView).toHaveBeenCalledWith(center, 12);
  });

  it('skips the save when the map unmounts while its center is being read', async () => {
    const mapRef = {current: null};
    mapRef.current = {
      getCenter: async () => {
        mapRef.current = null;
        return center;
      },
      getZoom: async () => 12,
    };
    await expect(renderHook(mapRef).handleMapMoved(moved)).resolves.toBeUndefined();
    expect(mockSetMapView).not.toHaveBeenCalled();
  });
});
