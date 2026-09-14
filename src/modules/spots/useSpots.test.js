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
import userReducer from '../user/userProfile.slice';

// discardSpot is a hook function rather than a reducer, so it is exercised through a probe component holding a
// real store - what matters is the state it leaves behind, not which actions it dispatched to get there.
describe('discardSpot', () => {
  const spotId = 1756000000001;
  const spot = {properties: {id: spotId, name: 'Spot 08'}, type: 'Feature'};
  const otherSpot = {properties: {id: 1756000000002, name: 'Spot 09'}, type: 'Feature'};

  const getPreloadedState = () => ({
    home: {hiddenWarnings: {}, loading: {home: false}, modalVisible: null},
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

  const discard = (spotToDiscard, spotNumberToRestore) => {
    const store = configureStore({
      preloadedState: getPreloadedState(),
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
});
