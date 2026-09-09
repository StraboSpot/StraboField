import projectReducer, {updatedModifiedTimestampsBySpotsIds} from './projects.slice';

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
