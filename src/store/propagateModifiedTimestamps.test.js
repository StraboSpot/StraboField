import {combineReducers, configureStore} from '@reduxjs/toolkit';

import listenerMiddleware from './listenerMiddleware';
import propagateModifiedTimestamps from './propagateModifiedTimestamps';
import connectionsReducer from '../modules/connections/connections.slice';
import projectReducer, {
  addedDatasetFromServer,
  addedDatasets,
  addedNewSpotIdToDataset,
  addedProject,
  addedProjectDescription,
  addedProjectFromServer,
  addedTagToSelectedSpot,
  deletedDataset,
  restoredSpotReferences,
  updatedDatasetProperties,
  updatedProject,
} from '../modules/project/projects.slice';
import * as spotsSliceExports from '../modules/spots/spots.slice';
import spotReducer, {
  addedSpotsFromServer,
  deletedSpot,
  deletedSpots,
  editedOrCreatedSpot,
  editedOrCreatedSpots,
  editedSpotImage,
  editedSpotImages,
  editedSpotProperties,
  restoredIntervalDragSnapshot,
  restoredSpots,
} from '../modules/spots/spots.slice';

const reducer = propagateModifiedTimestamps(combineReducers({project: projectReducer, spot: spotReducer}));

const OLD = 1;
const NOW = 1762000000000;

const spotId = 1756000000001;
const otherSpotId = 1756000000002;
const spotInOtherDatasetId = 1756000000003;

const makeSpot = (id, properties = {}) => ({
  geometry: {coordinates: [0, 0], type: 'Point'},
  properties: {id: id, modified_timestamp: OLD, name: 'Spot ' + id, ...properties},
  type: 'Feature',
});

const getState = ({selectedSpotId} = {}) => {
  const spots = {
    [spotId]: makeSpot(spotId, {images: [{id: 'i1', title: 'Photo'}]}),
    [otherSpotId]: makeSpot(otherSpotId),
    [spotInOtherDatasetId]: makeSpot(spotInOtherDatasetId),
  };
  return reducer({
    project: {
      activeDatasetsIds: [],
      datasets: {
        12: {id: 12, modified_timestamp: OLD, name: 'Dataset 1', spotIds: [spotId, otherSpotId]},
        13: {id: 13, modified_timestamp: OLD, name: 'Dataset 2', spotIds: [spotInOtherDatasetId]},
      },
      project: {id: 1, modified_timestamp: OLD},
      selectedTag: {},
    },
    spot: {recentViews: [], selectedAttributes: [], selectedSpot: spots[selectedSpotId] || {}, spots: spots},
  }, {type: 'test/init'});
};

const getStateWithNoProjectOpen = () => {
  const state = getState();
  return {...state, project: {...state.project, project: {}}};
};

const getTimestamps = state => ({
  dataset12: state.project.datasets[12].modified_timestamp,
  dataset13: state.project.datasets[13].modified_timestamp,
  project: state.project.project.modified_timestamp,
});

beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(NOW));
afterEach(() => jest.restoreAllMocks());

describe('a Spot change', () => {
  it('updates the Spot, the dataset holding it and the project to the same time', () => {
    const state = reducer(getState(), editedSpotProperties({field: 'notes', spotId: spotId, value: 'Sunny'}));
    expect(state.spot.spots[spotId].properties.modified_timestamp).toBe(NOW);
    expect(getTimestamps(state)).toEqual({dataset12: NOW, dataset13: OLD, project: NOW});
  });

  // These find their Spot from the selected one, so the action alone does not say which dataset to update
  it('finds the Spot from the selection when the action does not name it', () => {
    const state = reducer(getState({selectedSpotId: spotInOtherDatasetId}),
      editedSpotProperties({field: 'notes', value: 'Sunny'}));
    expect(getTimestamps(state)).toEqual({dataset12: OLD, dataset13: NOW, project: NOW});
  });

  it('updates every dataset holding a Spot changed together', () => {
    const state = reducer(getState(), editedOrCreatedSpots([makeSpot(otherSpotId), makeSpot(spotInOtherDatasetId)]));
    expect(getTimestamps(state)).toEqual({dataset12: NOW, dataset13: NOW, project: NOW});
  });

  it('updates the images of the selected Spot and its dataset', () => {
    const state = reducer(getState({selectedSpotId: spotId}), editedSpotImages([{id: 'i2'}]));
    expect(state.spot.spots[spotId].properties.modified_timestamp).toBe(NOW);
    expect(getTimestamps(state)).toEqual({dataset12: NOW, dataset13: OLD, project: NOW});
  });

  // It used to stamp the selected Spot instead, which is not the one changed when another Spot holds the image
  it('updates the Spot holding an edited image, not the Spot that happens to be selected', () => {
    const state = reducer(getState({selectedSpotId: spotInOtherDatasetId}), editedSpotImage({id: 'i1', title: 'New'}));
    expect(state.spot.spots[spotId].properties.modified_timestamp).toBe(NOW);
    expect(state.spot.spots[spotInOtherDatasetId].properties.modified_timestamp).toBe(OLD);
    expect(getTimestamps(state)).toEqual({dataset12: NOW, dataset13: OLD, project: NOW});
  });

  it('updates the project alone for a Spot in no dataset yet', () => {
    const state = reducer(getState(), editedOrCreatedSpot(makeSpot(1756000000009)));
    expect(getTimestamps(state)).toEqual({dataset12: OLD, dataset13: OLD, project: NOW});
  });

  // A deleted Spot's id is taken out of its dataset by a separate action, so here it is still listed and found. The
  // actions are made in the test, after Date.now is mocked, since they take their time when made.
  it.each([
    ['one Spot', () => deletedSpot(spotId), {dataset12: NOW, dataset13: OLD, project: NOW}],
    ['several Spots', () => deletedSpots([spotId, spotInOtherDatasetId]),
      {dataset12: NOW, dataset13: NOW, project: NOW}],
  ])('updates the datasets of %s deleted and the project', (name, makeAction, timestamps) => {
    expect(getTimestamps(reducer(getState(), makeAction()))).toEqual(timestamps);
  });

  // The delete may already have been sent, so restoring the old timestamps would leave the dataset older than the
  // server's copy and the restored Spots would never go up
  it('updates the datasets of Spots restored by an undo rather than putting their old timestamps back', () => {
    const before = getState();
    const deleted = before.spot.spots[spotId];
    let state = reducer(before, deletedSpot(spotId));
    state = reducer(state, restoredSpotReferences({datasets: before.project.datasets}));
    state = reducer(state, restoredSpots({[spotId]: deleted}));
    expect(state.spot.spots[spotId]).toEqual(deleted);
    expect(getTimestamps(state)).toEqual({dataset12: NOW, dataset13: OLD, project: NOW});
  });

  it('updates the project when an undo puts its tags back, leaving datasets it did not change', () => {
    const before = getState();
    const tags = [{id: 't1', name: 'Tag 1', spots: [spotId]}];
    const state = reducer(before, restoredSpotReferences({datasets: before.project.datasets, tags: tags}));
    expect(state.project.project.tags).toEqual(tags);
    expect(getTimestamps(state)).toEqual({dataset12: OLD, dataset13: OLD, project: NOW});
  });

  it('does nothing when the Spot it names is not there', () => {
    const before = getState();
    const state = reducer(before, editedSpotProperties({field: 'notes', spotId: 1756000000009, value: 'Sunny'}));
    expect(getTimestamps(state)).toEqual(getTimestamps(before));
  });

  it('changes nothing when no project is open', () => {
    const action = editedSpotProperties({field: 'notes', spotId: spotId, value: 'Sunny'});
    const state = reducer(getStateWithNoProjectOpen(), action);
    expect(state.project.project).toEqual({});
    expect(state.project.datasets[12].modified_timestamp).toBe(OLD);
  });
});

describe('a Spot change held back for an interval drag', () => {
  it('moves the Spot but leaves its dataset and the project until the reorder is saved', () => {
    const state = reducer(getState(), editedOrCreatedSpots([makeSpot(spotId)], {shouldPropagateTimestamps: false}));
    expect(state.spot.spots[spotId].properties.modified_timestamp).toBe(NOW);
    expect(getTimestamps(state)).toEqual({dataset12: OLD, dataset13: OLD, project: OLD});
  });

  it('leaves them alone when a cancel puts the snapshot back', () => {
    const state = reducer(getState(), restoredIntervalDragSnapshot([makeSpot(spotId)]));
    expect(getTimestamps(state)).toEqual({dataset12: OLD, dataset13: OLD, project: OLD});
  });
});

describe('a project change', () => {
  it('updates a dataset changed and the project', () => {
    const state = reducer(getState(), addedNewSpotIdToDataset({datasetId: 13, spotId: 1756000000009}));
    expect(getTimestamps(state)).toEqual({dataset12: OLD, dataset13: NOW, project: NOW});
  });

  it('updates a renamed dataset and the project', () => {
    const state = reducer(getState(), updatedDatasetProperties({id: 13, name: 'Renamed'}));
    expect(state.project.datasets[13].name).toBe('Renamed');
    expect(getTimestamps(state)).toEqual({dataset12: OLD, dataset13: NOW, project: NOW});
  });

  it('updates the project alone for a change to its own content', () => {
    const state = reducer(getState(), updatedProject({field: 'tags', value: [{id: 't1', name: 'Tag'}]}));
    expect(getTimestamps(state)).toEqual({dataset12: OLD, dataset13: OLD, project: NOW});
  });

  it('updates the project for a deleted dataset', () => {
    const state = reducer(getState(), deletedDataset(13));
    expect(state.project.project.modified_timestamp).toBe(NOW);
    expect(state.project.datasets[12].modified_timestamp).toBe(OLD);
  });

  it('marks a project just created as modified', () => {
    const state = reducer(getStateWithNoProjectOpen(), addedProjectDescription({id: 2, modified_timestamp: OLD}));
    expect(state.project.project).toEqual({id: 2, modified_timestamp: NOW});
  });

  // State kept beside the project, such as what the tag pages are doing, is not saved with it
  it('leaves the timestamps alone when nothing saved changes', () => {
    const state = reducer(getState(), addedTagToSelectedSpot(true));
    expect(getTimestamps(state)).toEqual({dataset12: OLD, dataset13: OLD, project: OLD});
  });

  it('changes nothing when no project is open', () => {
    const state = reducer(getStateWithNoProjectOpen(), updatedDatasetProperties({id: 13, name: 'Renamed'}));
    expect(state.project.project).toEqual({});
    expect(state.project.datasets[13].modified_timestamp).toBe(OLD);
  });
});

// A project, datasets or Spots arriving from the server, a backup or the device are not a change made here
describe('a load', () => {
  const loadedDatasets = {
    12: {id: 12, modified_timestamp: OLD, name: 'Loaded 1', spotIds: [spotId]},
    13: {id: 13, modified_timestamp: OLD, name: 'Loaded 2', spotIds: []},
  };
  it.each([
    ['addedDatasets', addedDatasets(loadedDatasets)],
    ['addedDatasetFromServer', addedDatasetFromServer(loadedDatasets[12])],
    ['addedProject', addedProject({id: 1, modified_timestamp: OLD, description: {project_name: 'Loaded'}})],
    ['addedProjectFromServer', addedProjectFromServer({id: 1, modified_timestamp: OLD, description: {}})],
    ['addedSpotsFromServer', addedSpotsFromServer([makeSpot(spotId, {name: 'From server'})])],
  ])('keeps the timestamps %s arrives with', (name, action) => {
    expect(getTimestamps(reducer(getState(), action))).toEqual({dataset12: OLD, dataset13: OLD, project: OLD});
  });
});

// Why this is done in the reducer rather than in a listener: the dirty-flag listeners compare timestamps before and
// after each action, so they have to be updated in the same dispatch as the change
describe('with the dirty-flag listeners', () => {
  const getStore = () => configureStore({
    middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    preloadedState: getState(),
    reducer: propagateModifiedTimestamps(
      combineReducers({connections: connectionsReducer, project: projectReducer, spot: spotReducer})),
  });

  it('marks a local save needed for a Spot edit', () => {
    const store = getStore();
    store.dispatch(editedSpotProperties({field: 'notes', spotId: spotId, value: 'Sunny'}));
    expect(store.getState().connections.isLocalSaveNeeded).toBe(true);
  });

  it('does not mark a local save needed for a load', () => {
    const store = getStore();
    store.dispatch(addedDatasets(store.getState().project.datasets));
    store.dispatch(addedSpotsFromServer([makeSpot(spotId, {name: 'From server'})]));
    expect(store.getState().connections.isLocalSaveNeeded).toBe(false);
  });

  // A download that fails after the project arrives must not leave the half-loaded project flagged for auto backup
  it('does not mark a local save needed for a load that changes the timestamps', () => {
    const store = getStore();
    store.dispatch(addedProjectFromServer({id: 1, modified_timestamp: OLD + 1, description: {}}));
    store.dispatch(addedDatasetFromServer({id: 12, modified_timestamp: OLD + 1, name: 'From server'}));
    expect(store.getState().connections.isLocalSaveNeeded).toBe(false);
  });
});

// A new Spot reducer that changes a Spot must be wrapped in withModifiedTimestamp. List it here only if it changes no
// Spot, or loads or restores Spots that keep their own timestamps.
it('has every Spot action that is not a change made here listed', () => {
  const actionsWithoutTimestamp = [
    'addedSpotsFromDevice',
    'addedSpotsFromServer',
    'clearedSelectedSpots',
    'clearedSpots',
    'deselectedAttributes',
    'resetSpotState',
    'restoredIntervalDragSnapshot',
    'setIntersectedSpotsForTagging',
    'setSelectedAttributes',
    'setSelectedSpot',
  ];
  // A string has a match method too, so an action creator is told apart by being a function as well
  const actionCreators = Object.entries(spotsSliceExports)
    .filter(([, value]) => typeof value === 'function' && typeof value.match === 'function');
  const unlisted = actionCreators
    .filter(([name, actionCreator]) => !actionCreator({}).meta?.timestamp && !actionsWithoutTimestamp.includes(name))
    .map(([name]) => name);
  expect(unlisted).toEqual([]);
});
