import {configureStore} from '@reduxjs/toolkit';

import listenerMiddleware from './listenerMiddleware.web';
import projectReducer, {movedSpotIdBetweenDatasets} from '../modules/project/projects.slice';
import spotReducer from '../modules/spots/spots.slice';
import userReducer from '../modules/user/userProfile.slice';
import {moveSpotToDataset} from '../services/network/serverRequests.web';

jest.mock('react-native-toast-notifications', () => ({
  Toast: {hideAll: jest.fn(), show: jest.fn(), update: jest.fn()},
}));
jest.mock('../services/network/serverRequests.web', () => ({
  moveSpotToDataset: jest.fn(() => Promise.resolve({})),
}));

// Lets every promise waiting on a settled request run on
const flushPromises = () => new Promise(resolve => jest.requireActual('timers').setImmediate(resolve));

// A store with the listeners in place, so what a dispatch sends to the (mocked) server can be seen
const makeStore = ({project, spot}) => configureStore({
  middleware: getDefaultMiddleware => getDefaultMiddleware({immutableCheck: false, serializableCheck: false})
    .prepend(listenerMiddleware.middleware),
  preloadedState: {project: project, spot: spot, user: {encoded_login: 'login'}},
  reducer: {project: projectReducer, spot: spotReducer, user: userReducer},
});

describe('moving a Spot on web', () => {
  const spotId = 1756000000051;

  const moveSpot = async (readOnlyDatasetsIds) => {
    const store = makeStore({
      project: {
        datasets: {13: {id: 13, spotIds: [spotId]}, 14: {id: 14, spotIds: []}},
        project: {id: 1, modified_timestamp: 1},
        readOnlyDatasetsIds: readOnlyDatasetsIds,
      },
      spot: {recentViews: [], selectedSpot: {}, spots: {}},
    });
    store.dispatch(movedSpotIdBetweenDatasets({spotId: spotId, toDatasetId: 14}));
    await flushPromises();
  };

  beforeEach(() => moveSpotToDataset.mockClear());

  it('sends a move the reducer made', async () => {
    await moveSpot([]);
    expect(moveSpotToDataset).toHaveBeenCalledTimes(1);
  });

  // The reducer leaves a read only dataset alone, so the server must too
  it('sends nothing when the move is out of a read only dataset', async () => {
    await moveSpot([13]);
    expect(moveSpotToDataset).not.toHaveBeenCalled();
  });
});
