import {createListenerMiddleware, isAnyOf} from '@reduxjs/toolkit';
import * as turf from '@turf/turf';
import {Toast} from 'react-native-toast-notifications';

import {cancelledIntervalDrag, setIsDragIntervalMode} from '../modules/maps/maps.slice';
import {
  addedCustomFeatureTypes,
  addedDataset,
  addedTemplates,
  deletedDataset,
  movedSpotIdBetweenDatasets,
  setActiveTemplates,
  setUseContinuousTagging,
  setUseTemplate,
  updatedDatasetProperties,
  updatedProject,
} from '../modules/project/projects.slice';
import {
  deletedSpot,
  editedOrCreatedSpot,
  editedOrCreatedSpots,
  editedSpotImage,
  editedSpotImages,
  editedSpotProperties,
} from '../modules/spots/spots.slice';
import {
  deleteDataset,
  moveSpotToDataset,
  updateProject,
  uploadProjectDatasetDeleteSpot,
  uploadProjectDatasetsSpots,
} from '../services/serverAPI';
import {isEmpty} from '../shared/Helpers';

// Spot IDs modified during drag interval mode — flushed to server when mode ends
let pendingDragSpotIds = new Set();

const alertAuthenticationError = () => {
  Toast.hideAll();
  window.alert(
    'Authentication Error! Changes NOT saved. Your connection has timed out. Please log in to StraboSpot again.');
  window.location.href = 'https://strabospot.org/';
};

// Remove spotIds and images from dataset because those shouldn't go up to the server
const cleanDatasets = (datasets) => {
  return datasets.map((dataset) => {
    const {spotIds, images, ...rest} = dataset;
    return rest;
  });
};

// Delete dataset, update Project on server DB
const deleteDatasetListener = async (action, listenerApi) => {
  Toast.hideAll();
  let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});
  console.log('Action:', action, 'Delete Dataset:', action.payload);

  const newState = listenerApi.getState();
  console.log('New State:', newState);

  const encodedLogin = newState.user.encoded_login;
  const project = newState.project.project;
  const datasetId = action.payload;

  try {
    const resJSON = await deleteDataset(datasetId, encodedLogin);
    console.log('deleteDataset resJSON', resJSON);

    const resJSON2 = await updateProject(project, encodedLogin);
    console.log('updateProject resJSON', resJSON2);

    Toast.update(toastId, 'Changes saved.', {type: 'success', duration: 3000});
  }
  catch (err) {
    alertAuthenticationError();
  }
};

// Move one Spot from a one Dataset to Another
const moveSpotToDatasetListener = async (action, listenerApi) => {
  Toast.hideAll();
  let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});
  console.log('Action:', action, 'Moving Spot to Dataset:', action.payload);

  const newState = listenerApi.getState();
  console.log('New State:', newState);

  const encodedLogin = newState.user.encoded_login;
  const {toDatasetId, spotId} = action.payload;
  const modifiedTimestamp = newState.project.project.modified_timestamp;

  try {
    const resJSON = await moveSpotToDataset(spotId, toDatasetId, modifiedTimestamp, encodedLogin);
    console.log('moved Spot to Dataset resJSON', resJSON);

    Toast.update(toastId, 'Changes saved.', {type: 'success', duration: 3000});
  }
  catch (err) {
    alertAuthenticationError();
  }
};

// Update project on server DB
const updateProjectListener = async (action, listenerApi) => {
  Toast.hideAll();
  let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});
  console.log('Action:', action, 'Updated Project:', action.payload);

  const newState = listenerApi.getState();
  console.log('New State:', newState);

  const encodedLogin = newState.user.encoded_login;
  const project = newState.project.project;

  try {
    const resJSON = await updateProject(project, encodedLogin);
    console.log('updateProject resJSON', resJSON);

    Toast.update(toastId, 'Changes saved.', {type: 'success', duration: 3000});
  }
  catch (err) {
    alertAuthenticationError();
  }
};

// Delete spot, update datasets and project on server DB
const uploadProjectDatasetDeleteSpotListener = async (action, listenerApi) => {
  Toast.hideAll();
  let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});
  console.log('Action:', action, 'Deleted Spot Id:', action.payload);

  listenerApi.cancelActiveListeners();      // Can cancel other running instances

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

  try {
    const resJSON = await uploadProjectDatasetDeleteSpot(jsonToSend, encodedLogin);
    console.log('uploadProjectDatasetDeleteSpot resJSON', resJSON);

    Toast.update(toastId, 'Changes saved.', {type: 'success', duration: 3000});
  }
  catch (err) {
    alertAuthenticationError();
  }
};

// Update spots, datasets and project on server DB
const updatedProjectDatasetsSpotsListener = async (action, listenerApi) => {
  // Defer interval-reorder saves until drag mode ends (avoids per-reorder server uploads)
  if (action.type.includes('spot/editedOrCreatedSpots') && listenerApi.getState().map.isDragIntervalMode) {
    action.payload.forEach(s => pendingDragSpotIds.add(s.properties.id));
    return;
  }

  Toast.hideAll();
  let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});
  console.log('Action:', action, 'Spot edited:', action.payload);

  listenerApi.cancelActiveListeners();      // Can cancel other running instances

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
      const dataset = datasets.find(d => d.spotIds?.find(id => id === spotId));
      const datasetId = dataset.id;
      if (Object.keys(acc).includes(datasetId.toString())) return {...acc, [datasetId]: [...acc[datasetId], spotId]};
      else return {...acc, [datasetId]: [spotId]};
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
    // Get Spot
    const spotId = action.payload?.properties?.id || newState.spot.selectedSpot.properties.id;
    const spot = newState.spot.spots[spotId];

    // Get dataset for spot
    let dataset = datasets.find(d => d.spotIds?.find(id => id === spotId));
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

  try {
    // Send object to server
    console.log('Sending updates to server', jsonToSend);
    const resJSON = await uploadProjectDatasetsSpots(jsonToSend, encodedLogin);
    console.log('uploadProjectDatasetsSpots resJSON', resJSON);

    Toast.update(toastId, 'Changes saved.', {type: 'success', duration: 3000});
  }
  catch (err) {
    alertAuthenticationError();
  }
};

// Flush deferred interval-reorder saves when drag mode is turned off
const intervalDragModeEndedListener = async (action, listenerApi) => {
  if (action.payload !== false || pendingDragSpotIds.size === 0) return;

  const spotIds = [...pendingDragSpotIds];
  pendingDragSpotIds = new Set();

  Toast.hideAll();
  let toastId = Toast.show('Saving changes...', {placement: 'bottom', duration: 100000});

  const newState = listenerApi.getState();
  const encodedLogin = newState.user.encoded_login;
  const project = newState.project.project;
  const datasets = Object.values(newState.project.datasets);

  const spotIdsGroupedByDatasetId = spotIds.reduce((acc, spotId) => {
    const dataset = datasets.find(d => d.spotIds?.find(id => id === spotId));
    if (!dataset) return acc;
    const datasetId = dataset.id;
    if (Object.keys(acc).includes(datasetId.toString())) return {...acc, [datasetId]: [...acc[datasetId], spotId]};
    else return {...acc, [datasetId]: [spotId]};
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
    alertAuthenticationError();
  }
};

const cancelledIntervalDragListener = () => {
  pendingDragSpotIds = new Set();
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
listenerMiddleware.startListening({actionCreator: setIsDragIntervalMode, effect: intervalDragModeEndedListener});
listenerMiddleware.startListening({actionCreator: cancelledIntervalDrag, effect: cancelledIntervalDragListener});

// Don't need to do addedSpotsFromDevice until can add from device on web
// listenerMiddleware.startListening({actionCreator: addedSpotsFromDevice, effect: updatedProjectDatasetSpotListener});

// Spot Move from One Dataset to Another
listenerMiddleware.startListening({actionCreator: movedSpotIdBetweenDatasets, effect: moveSpotToDatasetListener});
// Don't need to do addedNewSpotIdToDataset as editedOrCreatedSpot is called after this

// Project Only Updates to Send to Server
listenerMiddleware.startListening({
  matcher: isAnyOf(addedCustomFeatureTypes, addedTemplates, setActiveTemplates, setUseContinuousTagging,
    setUseTemplate, updatedProject),
  effect: updateProjectListener,
});

export default listenerMiddleware;
