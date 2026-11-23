import {createListenerMiddleware, isAnyOf} from '@reduxjs/toolkit';
import * as turf from '@turf/turf';
import {Toast} from 'react-native-toast-notifications';

import {PROJECT_SAVE_STATUS} from '../modules/connections/connections.constants';
import {setProjectSaveStatus} from '../modules/connections/connections.slice';
import {canceledIntervalDrag, savedIntervalDragReordering} from '../modules/maps/maps.slice';
import {
  addedCustomFeatureTypes,
  addedDataset,
  addedRemovedTagIdOnReport,
  addedTemplates,
  deletedDataset,
  movedSpotIdBetweenDatasets,
  setActiveTemplates,
  setUseContinuousTagging,
  setUseTemplate,
  updatedDatasetProperties,
  updatedProject,
} from '../modules/project/projects.slice';
import {canMoveSpotIdsToDataset, getDatasetWithSpotId} from '../modules/spots/spots.helpers';
import {
  deletedSpot,
  editedOrCreatedSpot,
  editedOrCreatedSpots,
  editedSpotImage,
  editedSpotImages,
  editedSpotProperties,
} from '../modules/spots/spots.slice';
import {isAuthenticationError} from '../services/network/serverRequests.helpers';
import {
  deleteDataset,
  moveSpotToDataset,
  updateProject,
  uploadProjectDatasetDeleteSpot,
  uploadProjectDatasetsSpots,
} from '../services/network/serverRequests.web';
import {isEmpty, toError} from '../shared/helpers';

// Spot IDs modified during drag interval mode — flushed to server when mode ends
let pendingDragSpotIds = new Set();

let deleteBatch;  // The deletes queued and not yet finished, which share one toast
let serverQueue = Promise.resolve();  // The last delete or move queued, which the next one waits on
// The Spots moved on the device that the server has yet to move, as the move is still being sent or failed, each with
// the dataset the server still has it in, by id as a string - see waitForMovesOutOf
const unmovedSpotDatasetIds = new Map();

const canceledIntervalDragListener = () => {
  pendingDragSpotIds = new Set();
};

// Remove spotIds and images from dataset because those shouldn't go up to the server
const cleanDatasets = (datasets) => {
  return withoutDuplicateIds(datasets, 'dataset').map((dataset) => {
    const {spotIds, images, ...rest} = dataset;
    if (rest.spots?.features) rest.spots = {...rest.spots, features: cleanSpots(rest.spots.features)};
    return rest;
  });
};

const cleanSpots = spots => withoutDuplicateIds(spots, 'Spot')
  .map(spot => (spot.properties?.images
    ? {...spot, properties: {...spot.properties, images: withoutDuplicateIds(spot.properties.images, 'image')}}
    : spot));

// Delete dataset, update Project on server DB
const deleteDatasetListener = (action, listenerApi) => {
  console.log('Action:', action, 'Delete Dataset:', action.payload);

  const newState = listenerApi.getState();
  console.log('New State:', newState);

  const encodedLogin = newState.user.encoded_login;
  const project = newState.project.project;
  const datasetId = action.payload;

  return queueServerDelete(async () => {
    const resJSON = await deleteDataset(datasetId, encodedLogin);
    console.log('deleteDataset resJSON', resJSON);

    const resJSON2 = await updateProject(project, encodedLogin);
    console.log('updateProject resJSON', resJSON2);
  });
};

// Flush deferred interval-reorder saves when drag mode is turned off
const intervalDragModeEndedListener = async (action, listenerApi) => {
  if (pendingDragSpotIds.size === 0) return;

  const spotIds = [...pendingDragSpotIds];
  pendingDragSpotIds = new Set();

  Toast.hideAll();
  let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});

  const newState = listenerApi.getState();
  const encodedLogin = newState.user.encoded_login;
  const project = newState.project.project;
  const datasets = Object.values(newState.project.datasets);

  const spotIdsGroupedByDatasetId = spotIds.reduce((acc, spotId) => {
    const dataset = getDatasetWithSpotId(datasets, spotId);
    if (!dataset) return acc;
    const datasetId = dataset.id;
    return {...acc, [datasetId]: [...(acc[datasetId] || []), spotId]};
  }, {});

  const datasetsToSend = Object.entries(spotIdsGroupedByDatasetId).reduce((acc, [datasetId, spotIdsInDataset]) => {
    const spots = spotIdsInDataset.map(spotId => newState.spot.spots[spotId]);
    return [...acc, {...newState.project.datasets[datasetId], spots: turf.featureCollection(spots)}];
  }, []);

  const objectToSend = {project: {...project, datasets: cleanDatasets(datasetsToSend)}};
  const jsonToSend = JSON.parse(JSON.stringify(objectToSend));

  try {
    const resJSON = await uploadProjectDatasetsSpots(jsonToSend, encodedLogin);
    console.log('uploadProjectDatasetsSpots (interval drag batch) resJSON', resJSON);
    Toast.update(toastId, 'Changes saved.', {type: 'success', duration: 3000});
  }
  catch (err) {
    reportSaveError(err, toastId);
  }
};

// Move Spots from one Dataset to another - a Spot together with its sample Spots. The server moves one Spot per call.
const moveSpotToDatasetListener = async (action, listenerApi) => {
  console.log('Action:', action, 'Moving Spot to Dataset:', action.payload);

  const newState = listenerApi.getState();
  console.log('New State:', newState);

  // Only a move the reducer made, leaving every read only dataset as it is on the server too. Asked of the state
  // before the move, which is what the reducer was given.
  const {spotIds, straboUserId, toDatasetId} = action.payload;
  const {datasets} = listenerApi.getOriginalState().project;
  if (isEmpty(spotIds) || !canMoveSpotIdsToDataset(spotIds, toDatasetId, datasets, straboUserId)) return;

  const encodedLogin = newState.user.encoded_login;
  const modifiedTimestamp = newState.project.project.modified_timestamp;

  // Queued with the deletes. It waits for any made before it, as each delete sends the project as it stood then, and
  // landing after the move would take the project's timestamp back to before it. One made after it waits for it, as
  // a dataset deleted straight after a sample is moved out of it would otherwise take the sample with it on the server.
  // Each counts as still where it was on the server until the server has moved it, as a failed one stays
  spotIds.forEach((spotId) => {
    const fromDataset = getDatasetWithSpotId(datasets, spotId);
    if (fromDataset) unmovedSpotDatasetIds.set(String(spotId), String(fromDataset.id));
  });

  return queueServerSend(async () => {
    Toast.hideAll();
    let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});

    try {
      for (const spotId of spotIds) {
        const resJSON = await moveSpotToDataset(spotId, toDatasetId, modifiedTimestamp, encodedLogin);
        console.log('moved Spot to Dataset resJSON', resJSON);
        unmovedSpotDatasetIds.delete(String(spotId));
      }

      Toast.update(toastId, 'Changes saved.', {type: 'success', duration: 3000});
    }
    catch (err) {
      reportSaveError(err, toastId);
    }
  });
};

// Deletes go to the server one at a time, in order. Deleting a Spot or a dataset can send a request per sample, each
// also sending the project, so sent all at once, whichever landed last would set the project's timestamp.
// Deletes queued together share one toast, as the toast library can bring back a stale 'Saving changes...' when
// several are updated in quick succession. Once the last one ends, it says how many failed.
const queueServerDelete = (send) => {
  if (!deleteBatch) deleteBatch = {errors: [], pendingCount: 0, totalCount: 0};
  const batch = deleteBatch;
  batch.pendingCount += 1;
  batch.totalCount += 1;
  return queueServerSend(async () => {
    if (!batch.toastId) {
      Toast.hideAll();
      batch.toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});
    }
    try {
      await send();
    }
    catch (err) {
      batch.errors.push(err);
    }
    finally {
      batch.pendingCount -= 1;
      if (batch.pendingCount === 0) {
        const failedCount = batch.errors.length;
        if (failedCount === 0) Toast.update(batch.toastId, 'Changes saved.', {type: 'success', duration: 3000});
        else if (failedCount === batch.totalCount) reportSaveError(batch.errors[0], batch.toastId);
        else {
          reportSaveError(batch.errors[0], batch.toastId,
            `${failedCount} of ${batch.totalCount} deletes NOT saved.`);
        }
        deleteBatch = undefined;
      }
    }
  });
};

// Sends to the server once every delete and move queued before it has been sent, and holds back any queued after it
// until it has. Failures are reported by whoever queues the send, but one that throws anyway must not stop every send
// after it.
const queueServerSend = (send) => {
  const queued = serverQueue.then(send);
  serverQueue = queued.catch(() => {
  });
  return queued;
};

// A web edit goes straight to the server, so a failed request means the change is not saved anywhere. Only a
// refused login is worth sending someone back to sign in for - a timeout, a server error or a rejected payload
// used to do the same, throwing away both the real cause and whatever they were in the middle of.
const reportSaveError = (err, toastId, heading = 'Changes NOT saved.') => {
  console.error('Error saving to the server', err);
  if (isAuthenticationError(err)) {
    Toast.hideAll();
    window.alert(
      'Authentication Error! Changes NOT saved. Your connection has timed out. Please log in to StraboSpot again.');
    window.location.href = 'https://strabospot.org/';
    return;
  }
  Toast.update(toastId, `${heading} ${toError(err).message}`, {type: 'danger', duration: 6000});
};

// Update spots, datasets and project on server DB
const updatedProjectDatasetsSpotsListener = async (action, listenerApi) => {
  // Defer interval-reorder saves until drag mode ends (avoids per-reorder server uploads)
  if (action.type.includes('spot/editedOrCreatedSpots') && listenerApi.getState().map.isDragIntervalMode) {
    action.payload.forEach(s => pendingDragSpotIds.add(s.properties.id));
    return;
  }

  console.log('Action:', action, 'Spot edited:', action.payload);

  const newState = listenerApi.getState();
  console.log('New State:', newState);

  const encodedLogin = newState.user.encoded_login;
  const project = newState.project.project;
  const datasets = Object.values(newState.project.datasets);

  let objectToSend;

  // Spots Updated
  if (action.type.includes('spot/editedOrCreatedSpots')) {
    const spotIds = action.payload.map(s => s.properties.id);
    const spotIdsGroupedByDatasetId = spotIds.reduce((acc, spotId) => {
      const dataset = getDatasetWithSpotId(datasets, spotId);
      // A Spot belongs to no dataset for a moment at times (e.g. a just-split line before Save Edits adds it to
      // the target dataset); it goes up with the dataset it joins, so skip it here
      if (!dataset) return acc;
      const datasetId = dataset.id;
      return {...acc, [datasetId]: [...(acc[datasetId] || []), spotId]};
    }, {});
    const datasetsToSend = Object.entries(spotIdsGroupedByDatasetId).reduce((acc, [datasetId, spotIdsInDataset]) => {
      const spots = spotIdsInDataset.map(spotIdInDataset => newState.spot.spots[spotIdInDataset]);
      return [...acc, {...newState.project.datasets[datasetId], spots: turf.featureCollection(spots)}];
    }, []);
    // Create object to send to server
    objectToSend = {project: {...project, datasets: cleanDatasets(datasetsToSend)}};
  }
  // Spot Updated
  else if (action.type.includes('spot/')) {
    // Get Spot - editedSpotProperties can edit a Spot other than the selected one (a sample's parent, edited after
    // the sample's delete has cleared the selection). An image edit identifies only the image, and changes whichever
    // Spot holds it.
    const spotId = editedSpotImage.match(action) ? Object.values(newState.spot.spots).find(
      spot => spot.properties.images?.some(image => image.id === action.payload.id))?.properties.id
      : action.payload?.properties?.id || action.payload?.spotId || newState.spot.selectedSpot?.properties?.id;
    const spot = newState.spot.spots[spotId];
    if (!spot) return;

    // Get dataset for spot
    let dataset = getDatasetWithSpotId(datasets, spotId);
    // Nothing to send while the Spot belongs to no dataset, as above, and no sibling Spot to send it with here
    if (!dataset) return;
    dataset = {...dataset, spots: turf.featureCollection([spot])};

    // Create object to send to server
    objectToSend = {project: {...project, datasets: cleanDatasets([dataset])}};
  }
  // Dataset(s) Updated
  else {
    // Create object to send to server
    objectToSend = {project: {...project, datasets: cleanDatasets(datasets)}};
  }
  const jsonToSend = JSON.parse(JSON.stringify(objectToSend));

  // Waits for any delete or move made before it, as it sends the project too and must not overtake one. With none
  // pending it goes straight out, and every such request times out, so the wait is bounded.
  await serverQueue;

  // Shown only once there is something to send. Toast.show puts the toast up on the next frame, so a Toast.hideAll
  // on this one runs before it exists and leaves it saying 'Saving changes...' for its full duration.
  Toast.hideAll();
  let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});

  try {
    // Send object to server
    console.log('Sending updates to server', jsonToSend);
    const resJSON = await uploadProjectDatasetsSpots(jsonToSend, encodedLogin);
    console.log('uploadProjectDatasetsSpots resJSON', resJSON);

    Toast.update(toastId, 'Changes saved.', {type: 'success', duration: 3000});
  }
  catch (err) {
    reportSaveError(err, toastId);
  }
};

// Update project on server DB.
// A modal is painted over the toast layer, so the toasts below are invisible to a save dispatched from
// inside one. The outcome is therefore also published as `projectSaveStatus` for those callers to report
// in place. The toasts still fire regardless — this listener can't tell who dispatched, and non-modal
// callers need them.
const updateProjectListener = async (action, listenerApi) => {
  Toast.hideAll();
  let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});
  console.log('Action:', action, 'Updated Project:', action.payload);

  listenerApi.dispatch(setProjectSaveStatus(PROJECT_SAVE_STATUS.SAVING));

  const newState = listenerApi.getState();
  console.log('New State:', newState);

  const encodedLogin = newState.user.encoded_login;
  const project = newState.project.project;

  try {
    const resJSON = await updateProject(project, encodedLogin);
    console.log('updateProject resJSON', resJSON);

    listenerApi.dispatch(setProjectSaveStatus(PROJECT_SAVE_STATUS.SAVED));
    Toast.update(toastId, 'Changes saved.', {type: 'success', duration: 3000});
  }
  catch (err) {
    listenerApi.dispatch(setProjectSaveStatus(PROJECT_SAVE_STATUS.ERROR));
    reportSaveError(err, toastId);
  }
};

// Delete spot, update datasets and project on server DB
const uploadProjectDatasetDeleteSpotListener = (action, listenerApi) => {
  console.log('Action:', action, 'Deleted Spot Id:', action.payload);

  const newState = listenerApi.getState();
  console.log('New State:', newState);

  const encodedLogin = newState.user.encoded_login;
  const project = newState.project.project;
  const datasets = newState.project.datasets;
  const spotId = action.payload;

  // Create object to send to server
  let objectToSend = {};
  if (!isEmpty(spotId)) objectToSend.spotId = spotId;
  if (!isEmpty(project)) objectToSend.project = newState.project.project;
  if (!isEmpty(datasets)) objectToSend.datasets = cleanDatasets(Object.values(datasets));
  const jsonToSend = JSON.parse(JSON.stringify(objectToSend));

  return queueServerDelete(async () => {
    const resJSON = await uploadProjectDatasetDeleteSpot(jsonToSend, encodedLogin);
    console.log('uploadProjectDatasetDeleteSpot resJSON', resJSON);
  });
};

// Whether the server has every Spot the device has moved out of the dataset moved out of it too, waiting for any such
// move still being sent. A web move is made on the device first and sent after, and a failed one is left as made
// there, so the server can still hold a Spot in a dataset the device shows it out of. Deleting the dataset there
// would delete the Spot with it. With no move out of it outstanding there is nothing to wait for.
export const waitForMovesOutOf = async (datasetId) => {
  const isMoveOutOutstanding = () => [...unmovedSpotDatasetIds.values()].includes(String(datasetId));
  if (!isMoveOutOutstanding()) return true;
  await serverQueue;
  return !isMoveOutOutstanding();
};

// The server keeps one row per id and rejects the whole save when a single command carries the same id twice
// ("ON CONFLICT DO UPDATE command cannot affect row a second time"), so anything that has ended up with two of
// something could never be saved again. Send each id once and say in the log what was left out.
const withoutDuplicateIds = (items, what) => {
  const seenIds = new Set();
  return (items || []).filter((item) => {
    const id = item?.id ?? item?.properties?.id;
    if (id === undefined || !seenIds.has(id)) {
      if (id !== undefined) seenIds.add(id);
      return true;
    }
    console.error(`Not sending a second ${what} with the id ${id} - the server can only hold one of it.`);
    return false;
  });
};

const listenerMiddleware = createListenerMiddleware();

// Spot, Dataset and Project Updates to Send to Server
// We do not need a listener for deletedSpots as that is only run when deleting
// a dataset and deleteDatasetListener takes care of deleting spots from server
listenerMiddleware.startListening({actionCreator: deletedDataset, effect: deleteDatasetListener});
listenerMiddleware.startListening({actionCreator: deletedSpot, effect: uploadProjectDatasetDeleteSpotListener});
listenerMiddleware.startListening({
  matcher: isAnyOf(addedDataset, editedOrCreatedSpot, editedOrCreatedSpots, editedSpotImage, editedSpotImages,
    editedSpotProperties, updatedDatasetProperties), effect: updatedProjectDatasetsSpotsListener,
});

// Batch-save interval reorder changes when drag mode ends
listenerMiddleware.startListening({actionCreator: savedIntervalDragReordering, effect: intervalDragModeEndedListener});
listenerMiddleware.startListening({actionCreator: canceledIntervalDrag, effect: canceledIntervalDragListener});

// Don't need to do addedSpotsFromDevice until can add from device on web
// listenerMiddleware.startListening({actionCreator: addedSpotsFromDevice, effect: updatedProjectDatasetSpotListener});

// Spot Move from One Dataset to Another
listenerMiddleware.startListening({actionCreator: movedSpotIdBetweenDatasets, effect: moveSpotToDatasetListener});
// Don't need to do addedNewSpotIdToDataset as editedOrCreatedSpot is called after this

// Project Only Updates to Send to Server
listenerMiddleware.startListening({
  matcher: isAnyOf(addedCustomFeatureTypes, addedRemovedTagIdOnReport, addedTemplates, setActiveTemplates,
    setUseContinuousTagging, setUseTemplate, updatedProject),
  effect: updateProjectListener,
});

export default listenerMiddleware;
