import {createNextState, isAnyOf} from '@reduxjs/toolkit';

import {
  addedDatasetFromServer,
  addedDatasets,
  addedProject,
  addedProjectFromServer,
  PROJECT_SLICE_NAME,
} from '../modules/project/projects.slice';
import {SPOT_SLICE_NAME} from '../modules/spots/spots.slice';
import {isEmpty, isSameId} from '../shared/helpers';

// Project actions that load a project or its datasets rather than change them, so what they load keeps the
// timestamps it arrives with. A new one has to be added here, or everything it loads looks unsaved. Clearing the
// project needs no entry: with no project open there is nothing to update.
const isProjectLoad = isAnyOf(addedDatasetFromServer, addedDatasets, addedProject, addedProjectFromServer);

// The keys whose value is not the one it was before the action - changed, added or removed
const getChangedKeys = (before = {}, after = {}) => {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter(key => before[key] !== after[key]);
};

// Sets the time on the datasets given that still exist, and on the project
const updateTimestamps = (nextState, datasetIds, timestamp) => {
  const project = createNextState(nextState.project, (projectState) => {
    datasetIds.forEach((datasetId) => {
      if (projectState.datasets[datasetId]) projectState.datasets[datasetId].modified_timestamp = timestamp;
    });
    projectState.project.modified_timestamp = timestamp;
  });
  return {...nextState, project: project};
};

// Spot changes carry the time they were made (withModifiedTimestamp in spots.slice). It compares the Spots before
// and after rather than reading the payload, because several actions find their Spot from the selected one. A Spot
// in no dataset yet, such as the new half of a line split during map editing, updates the project alone.
const updateAfterSpotAction = (state, nextState, action) => {
  const {shouldPropagateTimestamps, timestamp} = action.meta || {};
  if (!timestamp || !shouldPropagateTimestamps) return nextState;
  const changedSpotIds = getChangedKeys(state.spot.spots, nextState.spot.spots);
  if (isEmpty(changedSpotIds)) return nextState;
  const datasetIds = Object.keys(nextState.project.datasets).filter(datasetId => (
    nextState.project.datasets[datasetId].spotIds?.some(id => changedSpotIds.some(spotId => isSameId(id, spotId)))
  ));
  return updateTimestamps(nextState, datasetIds, timestamp);
};

// Datasets live in the project slice, so this covers both: a dataset changed updates it and the project, and a dataset
// deleted or a change to the project's own content, such as its tags and memos, updates the project alone
const updateAfterProjectAction = (state, nextState) => {
  const changedDatasetIds = getChangedKeys(state.project.datasets, nextState.project.datasets);
  const isProjectChanged = state.project.project !== nextState.project.project;
  if (isEmpty(changedDatasetIds) && !isProjectChanged) return nextState;
  return updateTimestamps(nextState, changedDatasetIds, Date.now());
};

// Updates the timestamps above whatever an action changed, so no reducer has to: a Spot change updates the datasets
// holding it and the project, and a dataset change updates the project. Spots and datasets live in different slices,
// so only a wrapper around them both can do this in the same dispatch as the change.
const propagateModifiedTimestamps = reducer => (state, action) => {
  const nextState = reducer(state, action);
  // With no project open there is nothing to update, and a timestamp alone would make an empty project look like one
  if (isEmpty(nextState.project.project)) return nextState;
  if (action.type.startsWith(SPOT_SLICE_NAME + '/')) return updateAfterSpotAction(state, nextState, action);
  if (action.type.startsWith(PROJECT_SLICE_NAME + '/') && !isProjectLoad(action)) {
    return updateAfterProjectAction(state, nextState);
  }
  return nextState;
};

export default propagateModifiedTimestamps;
