import {configureStore} from '@reduxjs/toolkit';

import listenerMiddleware from './listenerMiddleware.web';
import projectReducer, {movedSpotIdBetweenDatasets} from '../modules/project/projects.slice';
import spotReducer, {editedSpotImage, editedSpotProperties} from '../modules/spots/spots.slice';
import userReducer from '../modules/user/userProfile.slice';
import {moveSpotToDataset, uploadProjectDatasetsSpots} from '../services/network/serverRequests.web';

jest.mock('react-native-toast-notifications', () => ({
  Toast: {hideAll: jest.fn(), show: jest.fn(), update: jest.fn()},
}));
jest.mock('../services/network/serverRequests.web', () => ({
  moveSpotToDataset: jest.fn(() => Promise.resolve({})),
  uploadProjectDatasetsSpots: jest.fn(() => Promise.resolve({})),
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

// The edited Spot is the one sent up - whatever is selected, or if nothing is
describe('saving a Spot edit on web', () => {
  const parentId = 1756000000011;
  const otherId = 1756000000012;
  const image = {id: 1756000000021, title: 'Outcrop'};
  const parent = {
    properties: {id: parentId, images: [image], name: 'Spot 08', samples: [{id: 1756000000013}]},
    type: 'Feature',
  };
  const other = {properties: {id: otherId, name: 'Spot 09'}, type: 'Feature'};

  const getSentSpotIds = async (selectedSpot, action) => {
    const store = makeStore({
      project: {datasets: {12: {id: 12, name: 'Dataset 1', spotIds: [parentId, otherId]}}, project: {id: 1}},
      spot: {selectedSpot: selectedSpot, spots: {[otherId]: other, [parentId]: parent}},
    });
    store.dispatch(action);
    await flushPromises();
    return uploadProjectDatasetsSpots.mock.calls.map(
      ([sent]) => sent.project.datasets[0].spots.features.map(spot => spot.properties.id));
  };
  const editParent = selectedSpot => getSentSpotIds(selectedSpot,
    editedSpotProperties({field: 'samples', spotId: parentId, value: []}));

  beforeEach(() => uploadProjectDatasetsSpots.mockClear());

  it('sends the edited Spot rather than the selected one', async () => {
    expect(await editParent(other)).toEqual([[parentId]]);
  });

  // Deleting a sample clears the selection before its parent's stub is taken off
  it('sends the edited Spot when nothing is selected', async () => {
    expect(await editParent({})).toEqual([[parentId]]);
  });

  // An image edit identifies only the image, so its Spot is the one holding it
  it('sends the Spot holding an edited image rather than the selected one', async () => {
    expect(await getSentSpotIds(other, editedSpotImage({...image, title: 'Outcrop face'}))).toEqual([[parentId]]);
  });

  it('sends nothing for an image no Spot holds', async () => {
    expect(await getSentSpotIds(other, editedSpotImage({id: 1756000000099, title: 'Gone'}))).toEqual([]);
  });
});
