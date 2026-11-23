import {combineReducers} from '@reduxjs/toolkit';

import projectSliceReducer, {
  addedProjectFromServer,
  addedTagToSelectedSpot,
  addedTemplates,
  deletedDataset,
  deletedSpotIdFromDataset,
  deletedTemplate,
  migrateReportTimestamps,
  movedSpotIdBetweenDatasets,
  setActiveDatasets,
  setActiveDatasetsMultiple,
  setActiveTemplates,
  setTargetDataset,
  setUseContinuousTagging,
  setUseTemplate,
  updatedProject,
  updatedProjectPreference,
} from './projects.slice';
import propagateModifiedTimestamps from '../../store/propagateModifiedTimestamps';
import spotSliceReducer, {deletedSpot, deletedSpots} from '../spots/spots.slice';
import {MEASUREMENT_TEMPLATE_KEY} from '../templates/templates.constants';

// Through the root reducer wrapper, as in the store, since it is what updates the dataset and project timestamps
const rootReducer = propagateModifiedTimestamps(combineReducers({project: projectSliceReducer}));
const projectReducer = (state, action) => rootReducer({project: state}, action).project;

// Spot ids are stored as numbers, but a Spot deleted by a caller holding a string id has to come out just the same
const spotId = 1756000000001;
const otherSpotId = 1756000000002;

const getDatasetsState = () => ({
  datasets: {
    12: {id: 12, modified_timestamp: 1, name: 'Dataset 1', spotIds: [spotId, otherSpotId]},
    13: {id: 13, modified_timestamp: 1, name: 'Dataset 2', spotIds: [1756000000003]},
  },
  project: {modified_timestamp: 1},
});

// Read only as the server marks it
const getStateWithReadOnlyDataset = (datasetId) => {
  const state = getDatasetsState();
  state.datasets[datasetId].isReadOnly = true;
  return state;
};

// A dataset id can be held as a string, as after a download, and must still be known for the same dataset
describe('active datasets', () => {
  it('turns off a dataset held by its id as a string', () => {
    const state = {activeDatasetsIds: ['12', 13]};
    const {activeDatasetsIds} = projectReducer(state, setActiveDatasets({bool: false, dataset: 12}));
    expect(activeDatasetsIds).toEqual([13]);
  });

  it('turns on a dataset already held by its id as a string without adding it twice', () => {
    const state = {activeDatasetsIds: ['12']};
    const {activeDatasetsIds} = projectReducer(state, setActiveDatasets({bool: true, dataset: 12}));
    expect(activeDatasetsIds).toEqual(['12']);
  });

  it('keeps the target when it is still shown, known by its id as a string', () => {
    const state = {activeDatasetsIds: [12], targetDatasetId: '12'};
    expect(projectReducer(state, setActiveDatasetsMultiple([12, 13])).targetDatasetId).toBe('12');
  });

  it('stops showing a deleted dataset held by its id as a string', () => {
    const state = {...getDatasetsState(), activeDatasetsIds: ['12', 13]};
    const {activeDatasetsIds, datasets} = projectReducer(state, deletedDataset(12));
    expect(datasets[12]).toBeUndefined();
    expect(activeDatasetsIds).toEqual([13]);
  });

  it('drops the target when it is no longer shown', () => {
    const state = {activeDatasetsIds: [12], targetDatasetId: 12};
    expect(projectReducer(state, setActiveDatasetsMultiple([13])).targetDatasetId).toBeUndefined();
  });
});

describe('addedProjectFromServer', () => {
  // The whole point of the rename living in normalizeProject: memos arriving from the server are upgraded
  // before anything reads them, so the memo list sorts on one field name
  it('renames memo timestamps on a project coming from the server', () => {
    const incoming = {
      id: 1, modified_timestamp: 1,
      reports: [{id: 'r1', name: 'Old Memo', updated_timestamp: 1756000000000}],
    };
    const {project} = projectReducer({project: {}}, addedProjectFromServer(incoming));
    expect(project.reports[0].modified_timestamp).toBe(1756000000000);
    expect(project.reports[0]).not.toHaveProperty('updated_timestamp');
  });

  // The selected tag is a copy, and the tag pages save from it. Left as it was, it would write the tag back over
  // whatever the server merged into it.
  it('replaces the selected tag with the server\'s copy of it', () => {
    const state = {project: {tags: [{id: 't1', spots: [spotId]}]}, selectedTag: {id: 't1', spots: [spotId]}};
    const incoming = {id: 1, tags: [{id: 't1', spots: [spotId, otherSpotId]}]};
    const {selectedTag} = projectReducer(state, addedProjectFromServer(incoming));
    expect(selectedTag).toEqual({id: 't1', spots: [spotId, otherSpotId]});
  });

  it('clears the selected tag when the server no longer has it', () => {
    const state = {project: {tags: [{id: 't1'}]}, selectedTag: {id: 't1'}};
    const {selectedTag} = projectReducer(state, addedProjectFromServer({id: 1, tags: [{id: 't2'}]}));
    expect(selectedTag).toEqual({});
  });

  it('leaves no tag selected when none was', () => {
    const state = {project: {}, selectedTag: {}};
    const {selectedTag} = projectReducer(state, addedProjectFromServer({id: 1, tags: [{id: 't1'}]}));
    expect(selectedTag).toEqual({});
  });
});

describe('deletedSpotIdFromDataset', () => {
  it('takes the Spot out of the dataset it is given', () => {
    const {datasets} = projectReducer(getDatasetsState(), deletedSpotIdFromDataset({datasetId: 12, spotId: spotId}));
    expect(datasets[12].spotIds).toEqual([otherSpotId]);
  });

  it('takes the Spot out when its id is given as a string', () => {
    const action = deletedSpotIdFromDataset({datasetId: 12, spotId: spotId.toString()});
    const {datasets} = projectReducer(getDatasetsState(), action);
    expect(datasets[12].spotIds).toEqual([otherSpotId]);
  });
});

// A Spot deleted takes its id out of whatever in the project holds it, in the same dispatch
describe('deleting Spots', () => {
  // Through the Spot slice too, since a Spot delete is its action, and with the Spots there to delete
  const spotsRootReducer = propagateModifiedTimestamps(
    combineReducers({project: projectSliceReducer, spot: spotSliceReducer}));
  const spotsToDelete = [spotId, otherSpotId, 1756000000003].reduce(
    (acc, id) => ({...acc, [id]: {properties: {id: id}, type: 'Feature'}}), {});
  const deleteSpots = (state, action) => spotsRootReducer(
    {project: state, spot: {recentViews: [], selectedSpot: {}, spots: spotsToDelete}}, action).project;

  describe('from datasets', () => {
    it('takes the Spot out of the dataset holding it', () => {
      const {datasets} = deleteSpots(getDatasetsState(), deletedSpot(spotId));
      expect(datasets[12].spotIds).toEqual([otherSpotId]);
      expect(datasets[12].modified_timestamp).toBeGreaterThan(1);
    });

    it('takes the Spot out when its id is given as a string', () => {
      const {datasets} = deleteSpots(getDatasetsState(), deletedSpot(spotId.toString()));
      expect(datasets[12].spotIds).toEqual([otherSpotId]);
      expect(datasets[12].modified_timestamp).toBeGreaterThan(1);
    });

    // A dataset the Spot was never in must not be marked modified, or it gets uploaded for nothing
    it('leaves a dataset without the Spot untouched', () => {
      const {datasets} = deleteSpots(getDatasetsState(), deletedSpot(spotId.toString()));
      expect(datasets[13]).toEqual(getDatasetsState().datasets[13]);
    });

    it('leaves a dataset with no Spots yet unmarked', () => {
      const state = getDatasetsState();
      state.datasets[14] = {id: 14, modified_timestamp: 1, name: 'Empty'};
      const {datasets} = deleteSpots(state, deletedSpot(spotId));
      expect(datasets[14].modified_timestamp).toBe(1);
    });

    // An id left behind in a dataset after its Spot went, which the dataset delete allows for
    it('marks the dataset modified when the id deleted has no Spot left', () => {
      const state = getDatasetsState();
      state.datasets[14] = {id: 14, modified_timestamp: 1, name: 'Dangling', spotIds: [1756000000009]};
      const {datasets, project} = deleteSpots(state, deletedSpots([1756000000009]));
      expect(datasets[14].spotIds).toEqual([]);
      expect(datasets[14].modified_timestamp).toBeGreaterThan(1);
      expect(project.modified_timestamp).toBe(datasets[14].modified_timestamp);
    });

    it('takes several Spots out of their datasets at once', () => {
      const {datasets} = deleteSpots(getDatasetsState(), deletedSpots([spotId, '1756000000003']));
      expect(datasets[12].spotIds).toEqual([otherSpotId]);
      expect(datasets[13].spotIds).toEqual([]);
    });
  });

  describe('from memos', () => {
    const getState = () => ({
      datasets: {},
      project: {
        modified_timestamp: 1,
        reports: [
          {id: 'r1', name: 'Report 1', spots: [spotId, otherSpotId]},
          {id: 'r2', name: 'Report 2', spots: [otherSpotId]},
        ],
      },
    });

    it('takes the Spot out of the memo holding it, leaving the others alone', () => {
      const {project} = deleteSpots(getState(), deletedSpot(spotId));
      expect(project.reports[0].spots).toEqual([otherSpotId]);
      expect(project.reports[1].spots).toEqual([otherSpotId]);
    });

    it('takes the Spot out when its id is given as a string', () => {
      const {project} = deleteSpots(getState(), deletedSpot(spotId.toString()));
      expect(project.reports[0].spots).toEqual([otherSpotId]);
    });

    it('drops spots entirely when the Spot was the only one, string id or not', () => {
      const state = {
        datasets: {},
        project: {modified_timestamp: 1, reports: [{id: 'r1', name: 'Report 1', spots: [spotId]}]},
      };
      const {project} = deleteSpots(state, deletedSpot(spotId.toString()));
      expect(project.reports[0].spots).toBeUndefined();
      expect(project.reports[0].modified_timestamp).toBeGreaterThan(1);
    });

    // As a dataset delete does, with all its Spots in the one action
    it('takes several Spots out at once', () => {
      const {project} = deleteSpots(getState(), deletedSpots([spotId, otherSpotId.toString()]));
      expect(project.reports[0].spots).toBeUndefined();
      expect(project.reports[1].spots).toBeUndefined();
    });
  });

  describe('from tags', () => {
    const getState = () => ({
      datasets: {},
      project: {
        modified_timestamp: 1,
        tags: [
          {features: {[spotId]: ['f1'], [otherSpotId]: ['f2']}, id: 't1', name: 'Tag 1', spots: [spotId, otherSpotId]},
          {id: 't2', name: 'Tag 2', spots: [otherSpotId]},
        ],
      },
      selectedTag: {},
    });

    it('takes the Spot out of the tag holding it, leaving the others alone', () => {
      const {project} = deleteSpots(getState(), deletedSpot(spotId));
      expect(project.tags[0].spots).toEqual([otherSpotId]);
      expect(project.tags[1].spots).toEqual([otherSpotId]);
    });

    it('takes the Spot out when its id is given as a string', () => {
      const {project} = deleteSpots(getState(), deletedSpot(spotId.toString()));
      expect(project.tags[0].spots).toEqual([otherSpotId]);
    });

    // One change carries one time, so a tag or memo is never newer than the project holding it
    it('gives the tags and memos changed the delete\'s own time, as the project is given', () => {
      const state = {...getState(), project: {...getState().project, reports: [{id: 'r1', spots: [spotId]}]}};
      const action = deletedSpot(spotId);
      const {project} = deleteSpots(state, action);
      expect(project.tags[0].modified_timestamp).toBe(action.meta.timestamp);
      expect(project.reports[0].modified_timestamp).toBe(action.meta.timestamp);
      expect(project.modified_timestamp).toBe(action.meta.timestamp);
    });

    // Rewritten, they would re-render whatever shows them for nothing
    it('leaves the tags and memos not holding the Spot as they were', () => {
      const state = {...getState(), project: {...getState().project, reports: [{id: 'r1', spots: [otherSpotId]}]}};
      const {project} = deleteSpots(state, deletedSpot(spotId));
      expect(project.tags[1]).toBe(state.project.tags[1]);
      expect(project.reports).toBe(state.project.reports);
    });

    it('takes the Spot out of the selected tag too, which the tag pages save from', () => {
      const state = {...getState(), selectedTag: getState().project.tags[0]};
      const {selectedTag} = deleteSpots(state, deletedSpot(spotId));
      expect(selectedTag.spots).toEqual([otherSpotId]);
      expect(selectedTag.features).toEqual({[otherSpotId]: ['f2']});
    });

    // Its copy can hold a Spot the project's no longer does, and the next save from it would write the Spot back
    it('takes the Spot out of the selected tag even when the project\'s copy does not hold it', () => {
      const state = {...getState(), selectedTag: {id: 't2', name: 'Tag 2', spots: [spotId, otherSpotId]}};
      const {selectedTag} = deleteSpots(state, deletedSpot(spotId));
      expect(selectedTag.spots).toEqual([otherSpotId]);
    });

    // Adding a tag selects it, with no id, before it is saved, and it must not be lost to a Spot deleted meanwhile
    it('leaves a new tag being added alone', () => {
      const newTag = {type: 'concept'};
      expect(deleteSpots({...getState(), selectedTag: newTag}, deletedSpot(spotId)).selectedTag).toBe(newTag);
    });

    it('takes the Spot out of the tag features either way', () => {
      const {project} = deleteSpots(getState(), deletedSpot(spotId.toString()));
      expect(project.tags[0].features).toEqual({[otherSpotId]: ['f2']});
    });

    it('drops spots entirely when the Spot was the only one, string id or not', () => {
      const state = {
        datasets: {},
        project: {modified_timestamp: 1, tags: [{id: 't1', name: 'Tag 1', spots: [spotId]}]},
        selectedTag: {},
      };
      const {project} = deleteSpots(state, deletedSpot(spotId.toString()));
      expect(project.tags[0].spots).toBeUndefined();
    });

    // As a dataset delete does, with all its Spots in the one action
    it('takes several Spots out of the tags and their features at once', () => {
      const {project} = deleteSpots(getState(), deletedSpots([spotId, otherSpotId.toString()]));
      expect(project.tags[0].spots).toBeUndefined();
      expect(project.tags[0].features).toBeUndefined();
      expect(project.tags[1].spots).toBeUndefined();
    });
  });
});

// Memos used to stamp their edit time as updated_timestamp while the rest of the project called it
// modified_timestamp. Both ways in - the server and a file import through normalizeProject, and the device
// through the store's persist migration - rename it, so no read site has to know the old name.
describe('migrateReportTimestamps', () => {
  const stamp = 1756000000000;

  it('renames an old memo timestamp and drops the old key', () => {
    const [report] = migrateReportTimestamps([{id: 'r1', name: 'Memo', updated_timestamp: stamp}]);
    expect(report.modified_timestamp).toBe(stamp);
    expect(report).not.toHaveProperty('updated_timestamp');
  });

  it('leaves a memo that already has the new name alone', () => {
    const [report] = migrateReportTimestamps([{id: 'r1', modified_timestamp: stamp, name: 'Memo'}]);
    expect(report.modified_timestamp).toBe(stamp);
  });

  // Whichever wrote last, the new name wins and the stale one goes rather than both surviving
  it('keeps the new name when a memo somehow carries both', () => {
    const [report] = migrateReportTimestamps(
      [{id: 'r1', modified_timestamp: stamp, name: 'Memo', updated_timestamp: 1}]);
    expect(report.modified_timestamp).toBe(stamp);
    expect(report).not.toHaveProperty('updated_timestamp');
  });

  it('leaves a memo with no timestamp at all untouched', () => {
    const [report] = migrateReportTimestamps([{id: 'r1', name: 'Memo'}]);
    expect(report).toEqual({id: 'r1', name: 'Memo'});
  });

  it('takes a project with no reports without complaining', () => {
    expect(migrateReportTimestamps(undefined)).toBeUndefined();
  });
});

// The store's persist migration hands whatever is on the device to this, and a throw there makes redux-persist
// rehydrate the project slice as undefined - so it has to survive every shape, not just the expected one
describe('migrateReportTimestamps on malformed data', () => {
  it('survives an empty slot in the list', () => {
    expect(() => migrateReportTimestamps([null, undefined, {id: 'r1'}])).not.toThrow();
  });

  it('leaves an empty slot as it found it', () => {
    expect(migrateReportTimestamps([null, {id: 'r1', updated_timestamp: 1}])).toEqual(
      [null, {id: 'r1', modified_timestamp: 1}]);
  });

  it('survives a memo whose timestamp is not a number', () => {
    expect(() => migrateReportTimestamps([{id: 'r1', updated_timestamp: 'not a date'}])).not.toThrow();
  });

  it('takes an empty list', () => {
    expect(migrateReportTimestamps([])).toEqual([]);
  });
});

describe('movedSpotIdBetweenDatasets', () => {
  it('moves the Spot to the dataset it is given', () => {
    const action = movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 13});
    const {datasets} = projectReducer(getDatasetsState(), action);
    expect(datasets[12].spotIds).toEqual([otherSpotId]);
    expect(datasets[13].spotIds).toEqual([1756000000003, spotId]);
  });

  it('marks both datasets and the project as modified', () => {
    const state = getDatasetsState();
    state.datasets[14] = {id: 14, modified_timestamp: 1, name: 'Dataset 3', spotIds: [otherSpotId]};
    const action = movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 13});
    const {datasets, project} = projectReducer(state, action);
    expect(datasets[12].modified_timestamp).toBeGreaterThan(1);
    expect(datasets[13].modified_timestamp).toBeGreaterThan(1);
    expect(datasets[14].modified_timestamp).toBe(1);
    expect(project.modified_timestamp).toBeGreaterThan(1);
  });

  // Without the id coercion the Spot lands in the new dataset while staying in the old one
  it('moves the Spot when its id is given as a string', () => {
    const action = movedSpotIdBetweenDatasets({spotIds: [spotId.toString()], toDatasetId: 13});
    const {datasets} = projectReducer(getDatasetsState(), action);
    expect(datasets[12].spotIds).toEqual([otherSpotId]);
    expect(datasets[13].spotIds).toEqual([1756000000003, spotId.toString()]);
  });

  // A map edit used to add the Spot to the target dataset too, so picking one of the datasets holding it must leave
  // it in that one alone
  it('leaves a Spot that is in two datasets in only the one it is moved to', () => {
    const state = getDatasetsState();
    state.datasets[13].spotIds.push(spotId);
    const {datasets} = projectReducer(state, movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 12}));
    expect(datasets[12]).toEqual(getDatasetsState().datasets[12]);
    expect(datasets[13].spotIds).toEqual([1756000000003]);
  });

  // A Spot's samples are Spots of their own, so they go along with it, wherever each one was
  it('moves every Spot it is given, from whichever datasets hold them', () => {
    const sampleSpotId = 1756000000004;
    const state = getDatasetsState();
    state.datasets[14] = {id: 14, modified_timestamp: 1, name: 'Dataset 3', spotIds: [sampleSpotId]};
    const action = movedSpotIdBetweenDatasets({spotIds: [spotId, otherSpotId, sampleSpotId], toDatasetId: 13});
    const {datasets} = projectReducer(state, action);
    expect(datasets[12].spotIds).toEqual([]);
    expect(datasets[13].spotIds).toEqual([1756000000003, spotId, otherSpotId, sampleSpotId]);
    expect(datasets[14].spotIds).toEqual([]);
  });

  // Given in an order other than the dataset's, which must not reorder it
  it('leaves a dataset alone when the Spots are already in it', () => {
    const action = movedSpotIdBetweenDatasets({spotIds: [otherSpotId, spotId.toString()], toDatasetId: 12});
    const {datasets} = projectReducer(getDatasetsState(), action);
    expect(datasets[12]).toEqual(getDatasetsState().datasets[12]);
  });

  // A sample can already be in the dataset its parent is moved to
  it('adds only the Spots not already in the dataset, keeping its order', () => {
    const state = getDatasetsState();
    state.datasets[13].spotIds.push(otherSpotId);
    const action = movedSpotIdBetweenDatasets({spotIds: [spotId, otherSpotId], toDatasetId: 13});
    const {datasets} = projectReducer(state, action);
    expect(datasets[12].spotIds).toEqual([]);
    expect(datasets[13].spotIds).toEqual([1756000000003, otherSpotId, spotId]);
  });

  // Whatever the caller asks for, nothing in a read only dataset changes - not even its timestamp
  it('moves nothing into a read only dataset', () => {
    const state = getStateWithReadOnlyDataset(13);
    const {datasets} = projectReducer(state, movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 13}));
    expect(datasets).toEqual(state.datasets);
  });

  // Another user's dataset is read only to the user moving the Spots, who comes with the move
  it('moves nothing into another user\'s dataset', () => {
    const state = getDatasetsState();
    state.datasets[13].owner_straboUserId = 7;
    const action = movedSpotIdBetweenDatasets({spotIds: [spotId], straboUserId: 3, toDatasetId: 13});
    expect(projectReducer(state, action).datasets).toEqual(state.datasets);
  });

  it('moves Spots into a dataset the user owns', () => {
    const state = getDatasetsState();
    state.datasets[13].owner_straboUserId = 7;
    const action = movedSpotIdBetweenDatasets({spotIds: [spotId], straboUserId: '7', toDatasetId: 13});
    expect(projectReducer(state, action).datasets[13].spotIds).toEqual([1756000000003, spotId]);
  });

  // A sample already split off into a read only dataset can't move, and moving its parent alone would split them
  // further, so the parent stays too
  it('moves nothing when one of the Spots is in a read only dataset', () => {
    const sampleSpotId = 1756000000004;
    const state = getDatasetsState();
    state.datasets[14] = {id: 14, isReadOnly: true, modified_timestamp: 1, name: 'Dataset 3', spotIds: [sampleSpotId]};
    const action = movedSpotIdBetweenDatasets({spotIds: [spotId, sampleSpotId], toDatasetId: 13});
    const {datasets} = projectReducer(state, action);
    expect(datasets).toEqual(state.datasets);
  });

  // A Spot left in two datasets by the old map-edit bug can't be taken out of one that is read only
  it('leaves a Spot alone when a read only dataset also holds it', () => {
    const state = getStateWithReadOnlyDataset(13);
    state.datasets[13].spotIds.push(spotId);
    const {datasets} = projectReducer(state, movedSpotIdBetweenDatasets({spotIds: [spotId], toDatasetId: 12}));
    expect(datasets[13].spotIds).toEqual([1756000000003, spotId]);
    expect(datasets[13].modified_timestamp).toBe(1);
  });
});

describe('project settings', () => {
  // The setting is kept on the project and sent to the server, so changing it is a change to the project
  it('marks the project as modified when continuous tagging is switched', () => {
    const {project} = projectReducer({project: {modified_timestamp: 1}}, setUseContinuousTagging(true));
    expect(project.useContinuousTagging).toBe(true);
    expect(project.modified_timestamp).toBeGreaterThan(1);
  });

  // Only says where the tag being made goes, so opening the tag pages must not mark the project for save or sync
  it('leaves the project as it was when a tag is set to go on the selected Spot', () => {
    const {project} = projectReducer({project: {modified_timestamp: 1}}, addedTagToSelectedSpot(true));
    expect(project.modified_timestamp).toBe(1);
  });
});

// New Spots go into the target, so a read only dataset is never it
describe('target and read only datasets', () => {
  it('sets a writable dataset as the target', () => {
    expect(projectReducer(getStateWithReadOnlyDataset(13), setTargetDataset(12)).targetDatasetId).toBe(12);
  });

  it('leaves no target when asked for a read only dataset, known by its id as a string', () => {
    const state = {...getStateWithReadOnlyDataset(13), targetDatasetId: 12};
    expect(projectReducer(state, setTargetDataset('13')).targetDatasetId).toBeUndefined();
  });

  it('clears the target', () => {
    const state = {...getDatasetsState(), targetDatasetId: 12};
    expect(projectReducer(state, setTargetDataset(undefined)).targetDatasetId).toBeUndefined();
  });
});

// Measurement templates are stored as three flat keys while every other kind is stored as one bucket, so the
// reducers write through templates.helpers rather than indexing `templates` themselves. These pin the shape
// that reaches the server: a project is shared with collaborators who may be on an older build, so a reducer
// quietly writing the other shape would look fine here and only show up as missing templates over there.
describe('template reducers', () => {
  const planar = {id: 'a', name: 'Bedding', values: {type: 'planar_orientation'}};
  const linear = {id: 'b', name: 'Lineation', values: {type: 'linear_orientation'}};
  const note = {id: 'c', name: 'Daily', values: {note: 'Sunny'}};

  const getState = (templates = {}) => ({project: {modified_timestamp: 1, templates: templates}});

  const applyActions = (state, actions) => actions.reduce((acc, action) => projectReducer(acc, action), state);

  describe('a measurement key, stored as flat siblings', () => {
    it('writes the list, the active list and the in-use flag to their own keys', () => {
      const {project} = applyActions(getState(), [
        addedTemplates({key: MEASUREMENT_TEMPLATE_KEY, templates: [planar, linear]}),
        setActiveTemplates({key: MEASUREMENT_TEMPLATE_KEY, templates: [planar]}),
        setUseTemplate({key: MEASUREMENT_TEMPLATE_KEY, bool: true}),
      ]);
      expect(project.templates).toEqual({
        measurementTemplates: [planar, linear],
        activeMeasurementTemplates: [planar],
        useMeasurementTemplates: true,
      });
    });

    // Emptying these rather than deleting them is the one deliberate change of the accessor pass: the flat
    // measurement keys used to be deleted here while every other key kept an empty active list and a false
    // flag. No reader can tell the two apart - all of them default an absent value - so they now match.
    it('drops a deleted template from both lists and switches templates off with the last active one', () => {
      const state = getState({
        measurementTemplates: [planar, linear],
        activeMeasurementTemplates: [planar],
        useMeasurementTemplates: true,
      });
      const {project} = projectReducer(state, deletedTemplate({key: MEASUREMENT_TEMPLATE_KEY, template: planar}));
      expect(project.templates).toEqual({
        measurementTemplates: [linear],
        activeMeasurementTemplates: [],
        useMeasurementTemplates: false,
      });
    });

    it('keeps the other active templates, and templates on, when one of several is deleted', () => {
      const state = getState({
        measurementTemplates: [planar, linear],
        activeMeasurementTemplates: [planar, linear],
        useMeasurementTemplates: true,
      });
      const {project} = projectReducer(state, deletedTemplate({key: MEASUREMENT_TEMPLATE_KEY, template: planar}));
      expect(project.templates).toEqual({
        measurementTemplates: [linear],
        activeMeasurementTemplates: [linear],
        useMeasurementTemplates: true,
      });
    });

    it('takes the active list and the in-use flag with the last template', () => {
      const state = getState({
        measurementTemplates: [planar],
        activeMeasurementTemplates: [planar],
        useMeasurementTemplates: true,
      });
      const {project} = projectReducer(state, deletedTemplate({key: MEASUREMENT_TEMPLATE_KEY, template: planar}));
      expect(project.templates).toEqual({});
    });
  });

  describe('every other key, stored as one bucket', () => {
    it('writes the list, the active list and the in-use flag into a bucket it creates', () => {
      const {project} = applyActions(getState(), [
        addedTemplates({key: 'notes', templates: [note]}),
        setActiveTemplates({key: 'notes', templates: [note]}),
        setUseTemplate({key: 'notes', bool: true}),
      ]);
      expect(project.templates).toEqual({notes: {templates: [note], active: [note], isInUse: true}});
    });

    it('leaves the other keys alone', () => {
      const state = getState({measurementTemplates: [planar]});
      const {project} = projectReducer(state, addedTemplates({key: 'notes', templates: [note]}));
      expect(project.templates).toEqual({measurementTemplates: [planar], notes: {templates: [note]}});
    });

    it('takes the whole bucket with the last template', () => {
      const state = getState({notes: {templates: [note], active: [note], isInUse: true}});
      const {project} = projectReducer(state, deletedTemplate({key: 'notes', template: note}));
      expect(project.templates).toEqual({});
    });
  });

  // deletedTemplate was the one template reducer that did not do this, so a deletion could sit unsynced
  it('marks the project as modified on a delete, like the other template reducers do', () => {
    const state = getState({notes: {templates: [note], active: [note], isInUse: true}});
    const {project} = projectReducer(state, deletedTemplate({key: 'notes', template: note}));
    expect(project.modified_timestamp).toBeGreaterThan(1);
  });
});

describe('updatedProject', () => {
  it('replaces the selected tag with its copy in the new tag list', () => {
    const state = {project: {tags: [{id: 't1', name: 'Old'}]}, selectedTag: {id: 't1', name: 'Old'}};
    const {selectedTag} = projectReducer(state, updatedProject({field: 'tags', value: [{id: 't1', name: 'New'}]}));
    expect(selectedTag).toEqual({id: 't1', name: 'New'});
  });

  // The tag detail panel reads selectedTag.type, so it has to be left an object
  it('clears the selected tag when the new tag list no longer has it', () => {
    const state = {project: {tags: [{id: 't1'}]}, selectedTag: {id: 't1'}};
    const {selectedTag} = projectReducer(state, updatedProject({field: 'tags', value: [{id: 't2'}]}));
    expect(selectedTag).toEqual({});
  });
});

describe('updatedProjectPreference', () => {
  const getState = () => ({
    project: {
      modified_timestamp: 1,
      preferences: {spot_prefix: 'Spot ', starting_number_for_spot: 7, warn_on_dupe_spot_name: true},
    },
  });

  it('sets the preference it is given', () => {
    const {project} = projectReducer(getState(), updatedProjectPreference({key: 'starting_number_for_spot', value: 8}));
    expect(project.preferences.starting_number_for_spot).toBe(8);
  });

  // The point of having this alongside updatedProject, which replaces the whole preferences object
  it('leaves every other preference as it was', () => {
    const {project} = projectReducer(getState(), updatedProjectPreference({key: 'starting_number_for_spot', value: 8}));
    expect(project.preferences.spot_prefix).toBe('Spot ');
    expect(project.preferences.warn_on_dupe_spot_name).toBe(true);
  });

  // discardSpot hands back a Spot number that was unset before the Spot took it
  it('takes undefined as a value, so an unset preference can be restored to unset', () => {
    const state = projectReducer(getState(), updatedProjectPreference({key: 'starting_number_for_spot', value: 8}));
    const {project} = projectReducer(state, updatedProjectPreference({key: 'starting_number_for_spot'}));
    expect(project.preferences.starting_number_for_spot).toBeUndefined();
    expect(project.preferences.spot_prefix).toBe('Spot ');
  });

  it('adds preferences to a project that has none', () => {
    const {project} = projectReducer({project: {modified_timestamp: 1}}, updatedProjectPreference({key: 'a', value: 1}));
    expect(project.preferences).toEqual({a: 1});
  });

  it('marks the project as modified', () => {
    const {project} = projectReducer(getState(), updatedProjectPreference({key: 'starting_number_for_spot', value: 8}));
    expect(project.modified_timestamp).toBeGreaterThan(1);
  });
});
