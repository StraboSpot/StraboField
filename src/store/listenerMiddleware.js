import {createListenerMiddleware} from '@reduxjs/toolkit';
import {REHYDRATE} from 'redux-persist';

import {
  addPendingDatasetId,
  setLocalSaveNeeded,
  setPendingImagesChanges,
  setProjectSyncNeeded,
} from '../modules/connections/connections.slice';
import {addedDatasetFromServer, addedProjectFromServer, updatedProject} from '../modules/project/projects.slice';
import {editedSpotImages} from '../modules/spots/spots.slice';

const listenerMiddleware = createListenerMiddleware();

// Collect every image id across all of a project's reports (memo images).
const getReportImageIds = reports => new Set((reports || []).flatMap(report => (report.images || []).map(i => i.id)));

// Listener 1 — project timestamp changed → flag project sync needed + local save needed
listenerMiddleware.startListening({
  predicate: (action, curr, prev) =>
    action.type !== REHYDRATE && curr.project.project?.modified_timestamp !== prev.project.project?.modified_timestamp,
  effect: (action, {dispatch}) => {
    // A project applied from the server is already in sync - don't flag it for sync.
    if (action.type !== addedProjectFromServer.type) dispatch(setProjectSyncNeeded());
    dispatch(setLocalSaveNeeded());
  },
});

// Listener 2 — any dataset timestamp changed → queue dataset ids + mark local save needed
listenerMiddleware.startListening({
  predicate: (action, curr, prev) => {
    // Ignore rehydration: restoring persisted datasets isn't a local edit to queue for sync.
    if (action.type === REHYDRATE) return false;
    const c = curr.project.datasets, p = prev.project.datasets;
    return Object.keys(c).some(id => c[id]?.modified_timestamp !== p[id]?.modified_timestamp);
  },
  effect: (action, {dispatch, getState, getOriginalState}) => {
    const curr = getState().project.datasets;
    const prev = getOriginalState().project.datasets;
    // Datasets merged in from the server are already in sync - don't queue them for re-upload.
    const isFromServer = action.type === addedDatasetFromServer.type;
    Object.keys(curr).forEach((id) => {
      if (!isFromServer && curr[id]?.modified_timestamp !== prev[id]?.modified_timestamp) {
        dispatch(addPendingDatasetId(id));
      }
    });
    // A local dataset change (e.g. editing a spot) flags the project for sync too, so it re-syncs.
    if (!isFromServer) dispatch(setProjectSyncNeeded());
    dispatch(setLocalSaveNeeded());
  },
});

// Listener 3 — images added to a spot → flag images as pending upload to the server.
// The dataset + project timestamps are bumped at the call sites (each dispatches
// updatedModifiedTimestampsBySpotsIds alongside editedSpotImages), so listeners 1 & 2 queue the sync.
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

export default listenerMiddleware;
