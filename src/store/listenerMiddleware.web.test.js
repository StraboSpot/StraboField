import {configureStore} from '@reduxjs/toolkit';
import {Toast} from 'react-native-toast-notifications';

import listenerMiddleware, {waitForMovesOutOf} from './listenerMiddleware.web';
import projectReducer, {deletedDataset, movedSpotIdBetweenDatasets} from '../modules/project/projects.slice';
import spotReducer, {deletedSpot, editedSpotImage, editedSpotProperties} from '../modules/spots/spots.slice';
import userReducer from '../modules/user/userProfile.slice';
import {
  deleteDataset,
  moveSpotToDataset,
  updateProject,
  uploadProjectDatasetDeleteSpot,
  uploadProjectDatasetsSpots,
} from '../services/network/serverRequests.web';

jest.mock('react-native-toast-notifications', () => ({
  Toast: {hideAll: jest.fn(), show: jest.fn(), update: jest.fn()},
}));
jest.mock('../services/network/serverRequests.web', () => ({
  deleteDataset: jest.fn(),
  moveSpotToDataset: jest.fn(),
  updateProject: jest.fn(),
  uploadProjectDatasetDeleteSpot: jest.fn(),
  uploadProjectDatasetsSpots: jest.fn(() => Promise.resolve({})),
}));

// Lets every promise waiting on a settled request run on. A save waits its turn behind any deletes, even when there
// are none, so nothing is sent within the dispatch itself.
const flushPromises = () => new Promise(resolve => jest.requireActual('timers').setImmediate(resolve));

// A request that stays open until the test settles it, so what is sent meanwhile can be seen
const holdOpen = (mock) => {
  let settle;
  mock.mockImplementationOnce(() => new Promise((resolve) => {
    settle = resolve;
  }));
  return () => settle({});
};

// A store with the listeners in place, so what a dispatch sends to the (mocked) server can be seen
const makeStore = ({project, spot}) => configureStore({
  middleware: getDefaultMiddleware => getDefaultMiddleware({immutableCheck: false, serializableCheck: false})
    .prepend(listenerMiddleware.middleware),
  preloadedState: {project: project, spot: spot, user: {encoded_login: 'login'}},
  reducer: {project: projectReducer, spot: spotReducer, user: userReducer},
});

// Deleting a dataset deletes its samples filed in other datasets too, one request each, and takes their stubs off
// parents filed elsewhere. Sent all at once, whichever landed last would set the project's timestamp, and a failure
// could be covered by the next request's toast.
describe('deleting a dataset and its split samples on web', () => {
  const sampleIds = [1756000000031, 1756000000032];
  const parentId = 1756000000041;
  const parent = {properties: {id: parentId, name: 'Spot 10', samples: [{id: 1756000000042}]}, type: 'Feature'};

  beforeEach(() => {
    [deleteDataset, updateProject, uploadProjectDatasetDeleteSpot].forEach(mock => mock.mockReset());
    updateProject.mockResolvedValue({});
    uploadProjectDatasetDeleteSpot.mockResolvedValue({});
    uploadProjectDatasetsSpots.mockClear();
  });

  it('deletes the samples only after the dataset, one at a time, then unlinks the parents', async () => {
    const store = makeStore({
      project: {
        activeDatasetsIds: [12, 13, 14],
        datasets: {12: {id: 12, spotIds: []}, 13: {id: 13, spotIds: sampleIds}, 14: {id: 14, spotIds: [parentId]}},
        project: {id: 1},
      },
      spot: {recentViews: [], selectedSpot: {}, spots: {[parentId]: parent}},
    });
    const settleDatasetDelete = holdOpen(deleteDataset);
    const settleFirstSampleDelete = holdOpen(uploadProjectDatasetDeleteSpot);

    store.dispatch(deletedDataset(12));
    sampleIds.forEach(sampleId => store.dispatch(deletedSpot(sampleId)));
    store.dispatch(editedSpotProperties({field: 'samples', spotId: parentId, value: []}));
    await flushPromises();
    expect(deleteDataset).toHaveBeenCalledTimes(1);
    expect(uploadProjectDatasetDeleteSpot).not.toHaveBeenCalled();
    expect(uploadProjectDatasetsSpots).not.toHaveBeenCalled();

    settleDatasetDelete();
    await flushPromises();
    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(uploadProjectDatasetDeleteSpot.mock.calls.map(([sent]) => sent.spotId)).toEqual([sampleIds[0]]);
    expect(uploadProjectDatasetsSpots).not.toHaveBeenCalled();

    settleFirstSampleDelete();
    await flushPromises();
    expect(uploadProjectDatasetDeleteSpot.mock.calls.map(([sent]) => sent.spotId)).toEqual(sampleIds);
    expect(uploadProjectDatasetsSpots).toHaveBeenCalledTimes(1);
  });
});

// A Spot's samples go with it, a request each. Each with a toast of its own, the toast library could bring an earlier
// 'Saving changes...' back as the next went up, and leave it there.
describe('deleting a Spot and its samples on web', () => {
  const spotIds = [1756000000061, 1756000000062, 1756000000063];

  const deleteSpots = async () => {
    const store = makeStore({
      project: {datasets: {12: {id: 12, spotIds: []}}, project: {id: 1}},
      spot: {recentViews: [], selectedSpot: {}, spots: {}},
    });
    spotIds.forEach(spotId => store.dispatch(deletedSpot(spotId)));
    await flushPromises();
  };

  beforeEach(() => {
    [Toast.show, Toast.update, uploadProjectDatasetDeleteSpot].forEach(mock => mock.mockReset());
    Toast.show.mockReturnValue('toast-1');
  });

  it('shows one toast for them all, saved once the last is', async () => {
    uploadProjectDatasetDeleteSpot.mockResolvedValue({});
    await deleteSpots();
    expect(uploadProjectDatasetDeleteSpot).toHaveBeenCalledTimes(3);
    expect(Toast.show).toHaveBeenCalledTimes(1);
    expect(Toast.update.mock.calls).toEqual([['toast-1', 'Changes saved.', expect.anything()]]);
  });

  // The rest of them are saved, so it says how many weren't
  it('counts the deletes that failed rather than marking them all saved', async () => {
    uploadProjectDatasetDeleteSpot.mockResolvedValue({}).mockRejectedValueOnce(new Error('Server error'));
    await deleteSpots();
    expect(uploadProjectDatasetDeleteSpot).toHaveBeenCalledTimes(3);
    expect(Toast.update.mock.calls).toEqual([['toast-1', '1 of 3 deletes NOT saved. Server error', expect.anything()]]);
  });

  it('says none were saved when every delete failed', async () => {
    uploadProjectDatasetDeleteSpot.mockRejectedValue(new Error('Server error'));
    await deleteSpots();
    expect(Toast.update.mock.calls).toEqual([['toast-1', 'Changes NOT saved. Server error', expect.anything()]]);
  });
});

// A delete sends the project as it stood then, so a move it overtook would have the project's timestamp taken back
describe('moving a Spot on web', () => {
  const spotId = 1756000000051;

  // Dataset 13 holds the Spots given, to be moved to dataset 14
  const makeMoveStore = (spotIds = [spotId], isFromReadOnlyDataset = false) => makeStore({
    project: {
      activeDatasetsIds: [13, 14],
      datasets: {13: {id: 13, isReadOnly: isFromReadOnlyDataset, spotIds: spotIds}, 14: {id: 14, spotIds: []}},
      project: {id: 1, modified_timestamp: 1},
    },
    spot: {recentViews: [], selectedSpot: {}, spots: {}},
  });

  beforeEach(() => {
    [deleteDataset, moveSpotToDataset, updateProject].forEach(mock => mock.mockReset());
    updateProject.mockResolvedValue({});
    moveSpotToDataset.mockResolvedValue({});
  });

  it('moves a Spot only after a delete made before it', async () => {
    const store = makeStore({
      project: {
        activeDatasetsIds: [12, 13, 14],
        datasets: {12: {id: 12, spotIds: []}, 13: {id: 13, spotIds: [spotId]}, 14: {id: 14, spotIds: []}},
        project: {id: 1, modified_timestamp: 1},
      },
      spot: {recentViews: [], selectedSpot: {}, spots: {}},
    });
    const settleDatasetDelete = holdOpen(deleteDataset);

    store.dispatch(deletedDataset(12));
    store.dispatch(movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 14}));
    await flushPromises();
    expect(moveSpotToDataset).not.toHaveBeenCalled();

    settleDatasetDelete();
    await flushPromises();
    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(moveSpotToDataset.mock.calls.map(([sentSpotId, toDatasetId]) => [sentSpotId, toDatasetId]))
      .toEqual([[spotId, 14]]);
  });

  // Deleting a dataset moves its samples out first, and deleted first on the server they would go with it
  it('deletes a dataset only after a move made before it', async () => {
    const store = makeMoveStore();
    const settleMove = holdOpen(moveSpotToDataset);

    store.dispatch(movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 14}));
    store.dispatch(deletedDataset(13));
    await flushPromises();
    expect(moveSpotToDataset).toHaveBeenCalledTimes(1);
    expect(deleteDataset).not.toHaveBeenCalled();

    settleMove();
    await flushPromises();
    expect(deleteDataset).toHaveBeenCalledTimes(1);
  });

  // Deleting a dataset waits on this before deleting anything, as the server still has a Spot whose move failed
  // where it was
  it('says, once a move has been sent, whether the server moved the Spots out of the dataset', async () => {
    const store = makeMoveStore();
    const moveTo = toDatasetId => store.dispatch(movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId}));

    moveSpotToDataset.mockRejectedValueOnce(new Error('Server error'));
    moveTo(14);
    expect(await waitForMovesOutOf('13')).toBe(false);
    expect(await waitForMovesOutOf(14)).toBe(true);

    // Moved again, and this time the server takes it
    moveTo(13);
    moveTo(14);
    expect(await waitForMovesOutOf(13)).toBe(true);
  });

  // The server moved the first before failing on the second, so only the second is still where it was
  it('counts only the Spots not yet moved when a move fails partway', async () => {
    const sampleId = 1756000000052;
    const store = makeMoveStore([spotId, sampleId]);
    moveSpotToDataset.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Server error'));
    store.dispatch(movedSpotIdBetweenDatasets({spotIds: [spotId, sampleId], toDatasetId: 14}));
    expect(await waitForMovesOutOf(13)).toBe(false);

    // Only the second needs to go again
    store.dispatch(movedSpotIdBetweenDatasets({spotIds: [sampleId], toDatasetId: 13}));
    store.dispatch(movedSpotIdBetweenDatasets({spotIds: [sampleId], toDatasetId: 14}));
    expect(await waitForMovesOutOf(13)).toBe(true);
  });

  it('waits for a move still being sent', async () => {
    const store = makeMoveStore();
    const settleMove = holdOpen(moveSpotToDataset);
    store.dispatch(movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 14}));
    let isMoved;
    waitForMovesOutOf(13).then((result) => {
      isMoved = result;
    });
    await flushPromises();
    expect(isMoved).toBeUndefined();
    settleMove();
    await flushPromises();
    expect(isMoved).toBe(true);
  });

  // A dataset nothing is being moved out of can be deleted at once, however long the queue's other sends take
  it('waits for nothing when no move out of the dataset is outstanding', async () => {
    const store = makeMoveStore();
    const settleMove = holdOpen(moveSpotToDataset);
    store.dispatch(movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 14}));
    let isMoved;
    waitForMovesOutOf(14).then((result) => {
      isMoved = result;
    });
    await flushPromises();
    expect(isMoved).toBe(true);
    settleMove();  // Or every send queued in the tests after it would wait on it
    await flushPromises();
  });

  // The reducer leaves a read only dataset alone, so the server must too
  it('sends nothing when the move is out of a read only dataset', async () => {
    const store = makeMoveStore([spotId], true);
    store.dispatch(movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 14}));
    await flushPromises();
    expect(moveSpotToDataset).not.toHaveBeenCalled();
  });

  // The server moves one Spot per call, so a Spot and its samples are sent one after another
  it('sends each Spot in the move, the Spot first and then its samples', async () => {
    const sampleId = 1756000000052;
    const store = makeMoveStore([spotId, sampleId]);
    store.dispatch(movedSpotIdBetweenDatasets({spotIds: [spotId, sampleId], toDatasetId: 14}));
    await flushPromises();
    expect(moveSpotToDataset.mock.calls.map(([sentSpotId, toDatasetId]) => [sentSpotId, toDatasetId]))
      .toEqual([[spotId, 14], [sampleId, 14]]);
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
