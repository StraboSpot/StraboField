import projectReducer, {
  addedProjectFromServer,
  deletedSpotIdFromDataset,
  deletedSpotIdFromDatasets,
  deletedSpotIdFromReports,
  deletedSpotIdFromTags,
  migrateReportTimestamps,
  movedSpotIdBetweenDatasets,
  updatedModifiedTimestampsBySpotsIds,
  updatedProjectPreference,
} from './projects.slice';

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

describe('deletedSpotIdFromDatasets', () => {
  it('takes the Spot out of the dataset holding it', () => {
    const {datasets} = projectReducer(getDatasetsState(), deletedSpotIdFromDatasets(spotId));
    expect(datasets[12].spotIds).toEqual([otherSpotId]);
    expect(datasets[12].modified_timestamp).toBeGreaterThan(1);
  });

  it('takes the Spot out when its id is given as a string', () => {
    const {datasets} = projectReducer(getDatasetsState(), deletedSpotIdFromDatasets(spotId.toString()));
    expect(datasets[12].spotIds).toEqual([otherSpotId]);
    expect(datasets[12].modified_timestamp).toBeGreaterThan(1);
  });

  // A dataset the Spot was never in must not be marked modified, or it gets uploaded for nothing
  it('leaves a dataset without the Spot untouched', () => {
    const {datasets} = projectReducer(getDatasetsState(), deletedSpotIdFromDatasets(spotId.toString()));
    expect(datasets[13]).toEqual(getDatasetsState().datasets[13]);
  });
});

describe('deletedSpotIdFromReports', () => {
  const getState = () => ({
    project: {
      modified_timestamp: 1,
      reports: [
        {id: 'r1', name: 'Report 1', spots: [spotId, otherSpotId]},
        {id: 'r2', name: 'Report 2', spots: [otherSpotId]},
      ],
    },
  });

  it('takes the Spot out of the report holding it, leaving the others alone', () => {
    const {project} = projectReducer(getState(), deletedSpotIdFromReports(spotId));
    expect(project.reports[0].spots).toEqual([otherSpotId]);
    expect(project.reports[1].spots).toEqual([otherSpotId]);
  });

  it('takes the Spot out when its id is given as a string', () => {
    const {project} = projectReducer(getState(), deletedSpotIdFromReports(spotId.toString()));
    expect(project.reports[0].spots).toEqual([otherSpotId]);
  });

  it('drops spots entirely when the Spot was the only one, string id or not', () => {
    const state = {project: {modified_timestamp: 1, reports: [{id: 'r1', name: 'Report 1', spots: [spotId]}]}};
    const {project} = projectReducer(state, deletedSpotIdFromReports(spotId.toString()));
    expect(project.reports[0].spots).toBeUndefined();
    expect(project.reports[0].modified_timestamp).toBeGreaterThan(1);
  });
});

describe('deletedSpotIdFromTags', () => {
  const getState = () => ({
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
    const {project} = projectReducer(getState(), deletedSpotIdFromTags(spotId));
    expect(project.tags[0].spots).toEqual([otherSpotId]);
    expect(project.tags[1].spots).toEqual([otherSpotId]);
  });

  it('takes the Spot out when its id is given as a string', () => {
    const {project} = projectReducer(getState(), deletedSpotIdFromTags(spotId.toString()));
    expect(project.tags[0].spots).toEqual([otherSpotId]);
  });

  it('takes the Spot out of the tag features either way', () => {
    const {project} = projectReducer(getState(), deletedSpotIdFromTags(spotId.toString()));
    expect(project.tags[0].features).toEqual({[otherSpotId]: ['f2']});
  });

  it('drops spots entirely when the Spot was the only one, string id or not', () => {
    const state = {
      project: {modified_timestamp: 1, tags: [{id: 't1', name: 'Tag 1', spots: [spotId]}]},
      selectedTag: {},
    };
    const {project} = projectReducer(state, deletedSpotIdFromTags(spotId.toString()));
    expect(project.tags[0].spots).toBeUndefined();
  });
});

describe('movedSpotIdBetweenDatasets', () => {
  it('moves the Spot to the dataset it is given', () => {
    const action = movedSpotIdBetweenDatasets({spotId: spotId, toDatasetId: 13});
    const {datasets} = projectReducer(getDatasetsState(), action);
    expect(datasets[12].spotIds).toEqual([otherSpotId]);
    expect(datasets[13].spotIds).toEqual([1756000000003, spotId]);
  });

  // Without the id coercion the Spot lands in the new dataset while staying in the old one
  it('moves the Spot when its id is given as a string', () => {
    const action = movedSpotIdBetweenDatasets({spotId: spotId.toString(), toDatasetId: 13});
    const {datasets} = projectReducer(getDatasetsState(), action);
    expect(datasets[12].spotIds).toEqual([otherSpotId]);
    expect(datasets[13].spotIds).toEqual([1756000000003, spotId.toString()]);
  });
});

describe('updatedModifiedTimestampsBySpotsIds', () => {
  const spotId = 1756000000001;
  const getState = () => ({
    datasets: {
      12: {id: 12, modified_timestamp: 1, name: 'Dataset 1', spotIds: [spotId]},
      13: {id: 13, modified_timestamp: 1, name: 'Dataset 2', spotIds: [1756000000002]},
    },
    project: {modified_timestamp: 1},
  });

  it('marks the dataset holding the Spot as modified, and only that one', () => {
    const {datasets} = projectReducer(getState(), updatedModifiedTimestampsBySpotsIds([spotId]));
    expect(datasets[12].modified_timestamp).toBeGreaterThan(1);
    expect(datasets[13].modified_timestamp).toBe(1);
  });

  // Spot ids are stored in spotIds as numbers, but callers hand them over both ways
  it('finds the dataset when the Spot id is given as a string', () => {
    const {datasets} = projectReducer(getState(), updatedModifiedTimestampsBySpotsIds([spotId.toString()]));
    expect(datasets[12].modified_timestamp).toBeGreaterThan(1);
    expect(datasets[13].modified_timestamp).toBe(1);
  });

  it('marks the project as modified either way', () => {
    const {project} = projectReducer(getState(), updatedModifiedTimestampsBySpotsIds([spotId]));
    expect(project.modified_timestamp).toBeGreaterThan(1);
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
