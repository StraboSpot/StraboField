import {createListenerMiddleware} from '@reduxjs/toolkit';

import {
  addPendingDatasetId,
  setLocalSaveNeeded,
  setProjectDirty,
} from '../modules/connections/connections.slice';

const listenerMiddleware = createListenerMiddleware();

// Listener 1 — project timestamp changed → mark project dirty + local save needed
listenerMiddleware.startListening({
  predicate: (_, curr, prev) =>
    curr.project.project?.modified_timestamp !== prev.project.project?.modified_timestamp,
  effect: (_, {dispatch}) => {
    dispatch(setProjectDirty());
    dispatch(setLocalSaveNeeded());
  },
});

// Listener 2 — any dataset timestamp changed → queue dataset ids + mark local save needed
listenerMiddleware.startListening({
  predicate: (_, curr, prev) => {
    const c = curr.project.datasets, p = prev.project.datasets;
    return Object.keys(c).some(id => c[id]?.modified_timestamp !== p[id]?.modified_timestamp);
  },
  effect: (_, {dispatch, getState, getOriginalState}) => {
    const curr = getState().project.datasets;
    const prev = getOriginalState().project.datasets;
    Object.keys(curr).forEach(id => {
      if (curr[id]?.modified_timestamp !== prev[id]?.modified_timestamp) {
        dispatch(addPendingDatasetId(id));
      }
    });
    dispatch(setLocalSaveNeeded());
  },
});

export default listenerMiddleware;
