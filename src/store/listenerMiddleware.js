import {createListenerMiddleware} from '@reduxjs/toolkit';
import {REHYDRATE} from 'redux-persist';

import {setLocalSaveNeeded} from '../modules/connections/connections.slice';

const listenerMiddleware = createListenerMiddleware();

// Listener 1 — project timestamp changed → flag local save needed
listenerMiddleware.startListening({
  predicate: (action, curr, prev) =>
    action.type !== REHYDRATE && curr.project.project?.modified_timestamp !== prev.project.project?.modified_timestamp,
  effect: (action, {dispatch}) => {
    dispatch(setLocalSaveNeeded());
  },
});

// Listener 2 — any dataset timestamp changed → flag local save needed
listenerMiddleware.startListening({
  predicate: (action, curr, prev) => {
    // Ignore rehydration: restoring persisted datasets isn't a local edit.
    if (action.type === REHYDRATE) return false;
    const c = curr.project.datasets, p = prev.project.datasets;
    return Object.keys(c).some(id => c[id]?.modified_timestamp !== p[id]?.modified_timestamp);
  },
  effect: (action, {dispatch}) => {
    dispatch(setLocalSaveNeeded());
  },
});

export default listenerMiddleware;
