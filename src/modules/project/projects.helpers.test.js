import {getDatasetOwnerId, getSpotsInWritableDatasets, isDatasetReadOnly} from './projects.helpers';

describe('getDatasetOwnerId', () => {
  it('gives the dataset\'s own owner', () => {
    expect(getDatasetOwnerId({owner_straboUserId: 7}, 3)).toBe(7);
  });

  it('falls back to the project\'s owner for a dataset saved before the server sent one', () => {
    expect(getDatasetOwnerId({}, 3)).toBe(3);
    expect(getDatasetOwnerId(undefined, 3)).toBe(3);
  });
});

describe('isDatasetReadOnly', () => {
  it('is read only when the server says so, even for the user\'s own dataset', () => {
    expect(isDatasetReadOnly({isReadOnly: true, owner_straboUserId: 7}, 7)).toBe(true);
  });

  it('is read only when another user owns it, even where the server would allow it', () => {
    expect(isDatasetReadOnly({isReadOnly: false, owner_straboUserId: 7}, 3)).toBe(true);
  });

  it('is writable when the user owns it, comparing ids of different types', () => {
    expect(isDatasetReadOnly({owner_straboUserId: 7}, '7')).toBe(false);
  });

  it('leaves it to the server when either owner is unknown', () => {
    expect(isDatasetReadOnly({}, 7)).toBe(false);
    expect(isDatasetReadOnly({owner_straboUserId: 7}, null)).toBe(false);
    expect(isDatasetReadOnly(undefined, 7)).toBe(false);
  });
});

describe('getSpotsInWritableDatasets', () => {
  const spots = {1: {properties: {id: 1}}, 2: {properties: {id: 2}}, 3: {properties: {id: 3}}, 4: {properties: {id: 4}}};

  it('gives the Spots in the user\'s own datasets, leaving out another user\'s and read only ones', () => {
    const datasets = {
      10: {id: 10, owner_straboUserId: 7, spotIds: [1]},
      11: {id: 11, owner_straboUserId: 3, spotIds: [2]},
      12: {id: 12, isReadOnly: true, owner_straboUserId: 7, spotIds: [3]},
    };
    expect(getSpotsInWritableDatasets(datasets, spots, 7)).toEqual([spots[1]]);
  });

  it('leaves out Spots in no dataset and handles a dataset without spotIds', () => {
    const datasets = {10: {id: 10, owner_straboUserId: 7}, 11: {id: 11, owner_straboUserId: 7, spotIds: [2]}};
    expect(getSpotsInWritableDatasets(datasets, spots, 7)).toEqual([spots[2]]);
  });
});
