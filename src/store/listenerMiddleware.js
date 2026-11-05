import {createListenerMiddleware} from '@reduxjs/toolkit';
import {REHYDRATE} from 'redux-persist';

import {isProjectLoad} from './propagateModifiedTimestamps';
import {
  addPendingDatasetId,
  setLocalSaveNeeded,
  setPendingImagesChanges,
  setProjectSyncNeeded,
} from '../modules/connections/connections.slice';
import {addedChangedImageId, updatedProject} from '../modules/project/projects.slice';
import {editedSpotImages} from '../modules/spots/spots.slice';

const listenerMiddleware = createListenerMiddleware();

// Restoring persisted state or loading a project isn't a local edit, though the timestamps change. Telling them apart
// here, rather than clearing the flag once a load finishes, keeps a load that fails partway from leaving it set.
// Loads include a project or dataset applied from the server, which is already in sync, so it isn't queued either.
const isLoad = action => action.type === REHYDRATE || isProjectLoad(action);

// Collect every image id across all of a project's reports (memo images).
const getReportImageIds = reports => new Set((reports || []).flatMap(report => (report.images || []).map(i => i.id)));

// Listener 1 — project timestamp changed → flag project sync needed + local save needed
listenerMiddleware.startListening({
  predicate: (action, curr, prev) =>
    !isLoad(action) && curr.project.project?.modified_timestamp !== prev.project.project?.modified_timestamp,
  effect: (action, {dispatch}) => {
    dispatch(setProjectSyncNeeded());
    dispatch(setLocalSaveNeeded());
  },
});

// Listener 2 — any dataset timestamp changed → queue dataset ids + mark local save needed
listenerMiddleware.startListening({
  predicate: (action, curr, prev) => {
    if (isLoad(action)) return false;
    const c = curr.project.datasets, p = prev.project.datasets;
    return Object.keys(c).some(id => c[id]?.modified_timestamp !== p[id]?.modified_timestamp);
  },
  effect: (action, {dispatch, getState, getOriginalState}) => {
    const curr = getState().project.datasets;
    const prev = getOriginalState().project.datasets;
    Object.keys(curr).forEach((id) => {
      if (curr[id]?.modified_timestamp !== prev[id]?.modified_timestamp) dispatch(addPendingDatasetId(id));
    });
    // A local dataset change (e.g. editing a spot) flags the project for sync too, so it re-syncs.
    dispatch(setProjectSyncNeeded());
    dispatch(setLocalSaveNeeded());
  },
});

// Listener 3 — images added to a spot → flag images as pending upload to the server.
// The dataset + project timestamps are updated in the same dispatch by propagateModifiedTimestamps,
// so listeners 1 & 2 queue the sync.
listenerMiddleware.startListening({
  actionCreator: editedSpotImages,
  effect: (_action, {dispatch}) => {
    dispatch(setPendingImagesChanges(true));
  },
});

// Listener 4 — image added to a memo/report → flag images as pending upload to the server.
// updatedProject also fires for non-image report edits (text, tags), so only flag when a new image id appears.
listenerMiddleware.startListening({
  actionCreator: updatedProject,
  effect: (action, {dispatch, getState, getOriginalState}) => {
    if (action.payload?.field !== 'reports') return;
    const prevIds = getReportImageIds(getOriginalState().project.project?.reports);
    const currIds = getReportImageIds(getState().project.project?.reports);
    const hasNewImage = [...currIds].some(id => !prevIds.has(id));
    if (hasNewImage) dispatch(setPendingImagesChanges(true));
  },
});

// Listener 5 — an image redrawn in place (a sketch keeps its id) → flag images as pending upload to the server,
// so a cycle that skipped images (wifi only) still retries it later.
listenerMiddleware.startListening({
  actionCreator: addedChangedImageId,
  effect: (_action, {dispatch}) => {
    dispatch(setPendingImagesChanges(true));
  },
});

export default listenerMiddleware;
