import {createListenerMiddleware} from '@reduxjs/toolkit';
import {REHYDRATE} from 'redux-persist';

import {isProjectLoad} from './propagateModifiedTimestamps';
import {setLocalSaveNeeded} from '../modules/connections/connections.slice';

const listenerMiddleware = createListenerMiddleware();

// Restoring persisted state or loading a project isn't a local edit, though the timestamps change. Telling them apart
// here, rather than clearing the flag once a load finishes, keeps a load that fails partway from leaving it set.
const isLoad = action => action.type === REHYDRATE || isProjectLoad(action);

// Listener 1 — project timestamp changed → flag local save needed
listenerMiddleware.startListening({
  predicate: (action, curr, prev) =>
    !isLoad(action) && curr.project.project?.modified_timestamp !== prev.project.project?.modified_timestamp,
  effect: (action, {dispatch}) => {
    dispatch(setLocalSaveNeeded());
  },
});

// Listener 2 — any dataset timestamp changed → flag local save needed
listenerMiddleware.startListening({
  predicate: (action, curr, prev) => {
    if (isLoad(action)) return false;
    const c = curr.project.datasets, p = prev.project.datasets;
    return Object.keys(c).some(id => c[id]?.modified_timestamp !== p[id]?.modified_timestamp);
  },
  effect: (action, {dispatch}) => {
    dispatch(setLocalSaveNeeded());
  },
});

export default listenerMiddleware;
