import projectReducer, {updatedModifiedTimestampsBySpotsIds, updatedProjectPreference} from './projects.slice';

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
