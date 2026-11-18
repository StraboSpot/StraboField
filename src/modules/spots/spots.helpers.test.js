import {
  calculateMissingOrientations,
  canMoveSpotIdsToDataset,
  getDatasetWithSpotId,
  getSpotOrientations,
  getSpotsCount,
  isAnySpotIdInReadOnlyDataset,
  isSpotIdInDataset,
  isSpotIdInReadOnlyDataset,
} from './spots.helpers';
import {DEFAULT_ORIENTATION_FIELDS} from '../compass/compass.helpers';
import {THREE_D_STRUCTURE_ORIENTATION_FIELDS} from '../three-d-structures/threeDStructures.constants';

describe('calculateMissingOrientations', () => {
  it('calculates the dip direction 90 degrees round from the strike', () => {
    const measurement = {strike: 45};
    expect(calculateMissingOrientations(measurement, DEFAULT_ORIENTATION_FIELDS)).toBe(true);
    expect(measurement.dip_direction).toBe(135);
  });

  it('wraps the dip direction back through 360', () => {
    const measurement = {strike: 300};
    calculateMissingOrientations(measurement, DEFAULT_ORIENTATION_FIELDS);
    expect(measurement.dip_direction).toBe(30);
  });

  it('calculates the strike 90 degrees back from the dip direction', () => {
    const measurement = {dip_direction: 135};
    expect(calculateMissingOrientations(measurement, DEFAULT_ORIENTATION_FIELDS)).toBe(true);
    expect(measurement.strike).toBe(45);
  });

  it('gives a strike in range rather than a negative for a dip direction under 90', () => {
    const measurement = {dip_direction: 45};
    calculateMissingOrientations(measurement, DEFAULT_ORIENTATION_FIELDS);
    expect(measurement.strike).toBe(315);
  });

  it('treats a strike of 0 as a value to calculate from, not as missing', () => {
    const measurement = {strike: 0};
    expect(calculateMissingOrientations(measurement, DEFAULT_ORIENTATION_FIELDS)).toBe(true);
    expect(measurement.dip_direction).toBe(90);
  });

  it('leaves a record holding both fields alone', () => {
    const measurement = {dip_direction: 200, strike: 45};
    expect(calculateMissingOrientations(measurement, DEFAULT_ORIENTATION_FIELDS)).toBe(false);
    expect(measurement).toEqual({dip_direction: 200, strike: 45});
  });

  it('leaves a line, which holds neither field, alone', () => {
    const line = {plunge: 20, trend: 90, type: 'linear_orientation'};
    expect(calculateMissingOrientations(line, DEFAULT_ORIENTATION_FIELDS)).toBe(false);
    expect(line).toEqual({plunge: 20, trend: 90, type: 'linear_orientation'});
  });

  it('fills a 3D structure plane by the field names its own measurement group uses', () => {
    const fold = {Strike: 45, fold_fol_strike: 300};
    expect(calculateMissingOrientations(fold, THREE_D_STRUCTURE_ORIENTATION_FIELDS)).toBe(true);
    expect(fold.Azimuthal_Dip_Direction).toBe(135);
    expect(fold.fold_fol_dip_direction).toBe(30);
  });
});

describe('canMoveSpotIdsToDataset', () => {
  const datasets = {
    12: {id: 12, spotIds: [1, 2]},
    13: {id: 13, spotIds: ['3']},
  };

  it('moves the Spots when nothing is read only', () => {
    expect(canMoveSpotIdsToDataset([1, 2, 3], 14, datasets)).toBe(true);
  });

  it('moves none into a read only dataset', () => {
    expect(canMoveSpotIdsToDataset([1, 2], 13, datasets, [13])).toBe(false);
  });

  it('knows a read only dataset to move into by its id as a string', () => {
    expect(canMoveSpotIdsToDataset([1], '13', datasets, [13])).toBe(false);
  });

  // Moving the rest would split a Spot from its sample
  it('moves none when one of them is in a read only dataset, held by its id as a string', () => {
    expect(canMoveSpotIdsToDataset([1, 3], 12, datasets, [13])).toBe(false);
  });
});

describe('getDatasetWithSpotId', () => {
  const datasets = {12: {id: 12, spotIds: [1]}, 13: {id: 13, spotIds: ['2']}};

  it('finds the dataset holding a Spot by its id as a string, from an object or a list', () => {
    expect(getDatasetWithSpotId(datasets, 2)).toBe(datasets[13]);
    expect(getDatasetWithSpotId(Object.values(datasets), 2)).toBe(datasets[13]);
  });

  it('finds nothing for a Spot no dataset holds', () => {
    expect(getDatasetWithSpotId(datasets, 3)).toBeUndefined();
  });
});

describe('getSpotOrientations', () => {
  const spot = {
    properties: {
      _3d_structures: [{Strike: 45, id: 'f1', type: 'fold'}],
      earthquakes: [{id: 'q1', strike: 10}],
      orientation_data: [
        {associated_orientation: [{id: 'a1', strike: 20}], id: 'm1', strike: 30},
        {id: 'm2', plunge: 10, trend: 5},
      ],
    },
  };

  it('gathers every record that can hold a plane, associated planes included', () => {
    expect(getSpotOrientations(spot).map(({orientation}) => orientation.id))
      .toEqual(['m1', 'a1', 'm2', 'q1', 'f1']);
  });

  it('pairs each record with the fields its own form names', () => {
    const fieldsById = Object.fromEntries(
      getSpotOrientations(spot).map(({fields, orientation}) => [orientation.id, fields[0].dip_direction]));
    expect(fieldsById.m1).toBe('dip_direction');
    expect(fieldsById.a1).toBe('dip_direction');
    expect(fieldsById.q1).toBe('azimuth_dip_dir');
    expect(fieldsById.f1).toBe('Azimuthal_Dip_Direction');
  });

  it('gathers nothing from a Spot holding no such record', () => {
    expect(getSpotOrientations({properties: {name: 'Spot 1'}})).toEqual([]);
  });
});

describe('getSpotsCount', () => {
  const spots = {1: {properties: {id: 1}}, 2: {properties: {id: 2, isSample: true}}};

  it('leaves out the samples', () => {
    expect(getSpotsCount([1, 2], spots)).toBe(1);
  });

  it('leaves out a Spot missing from the device', () => {
    expect(getSpotsCount([1, 3], spots)).toBe(1);
  });

  it('counts none for a dataset without Spots', () => {
    expect(getSpotsCount(undefined, spots)).toBe(0);
  });
});

describe('isAnySpotIdInReadOnlyDataset', () => {
  const datasets = {12: {id: 12, spotIds: [1, 2]}, 13: {id: 13, spotIds: ['3']}};

  it('finds one Spot of several held by a read only dataset', () => {
    expect(isAnySpotIdInReadOnlyDataset([1, 3], datasets, [13])).toBe(true);
  });

  it('finds nothing when none of them is', () => {
    expect(isAnySpotIdInReadOnlyDataset([1, 2], datasets, [13])).toBe(false);
  });
});

describe('isSpotIdInDataset', () => {
  it('finds a Spot the dataset holds by its id as a string', () => {
    expect(isSpotIdInDataset({id: 12, spotIds: ['1756000000001']}, 1756000000001)).toBe(true);
  });

  it('finds nothing in a dataset without Spots', () => {
    expect(isSpotIdInDataset({id: 12}, 1756000000001)).toBe(false);
  });
});

describe('isSpotIdInReadOnlyDataset', () => {
  const datasets = {12: {id: 12, spotIds: [1]}, 13: {id: '13', spotIds: [1, '3']}};

  it('finds a Spot held by a read only dataset, matching ids held as strings', () => {
    expect(isSpotIdInReadOnlyDataset(3, datasets, [13])).toBe(true);
  });

  // The old map-edit bug could leave a Spot in two datasets
  it('finds a Spot when only the second dataset holding it is read only', () => {
    expect(isSpotIdInReadOnlyDataset(1, datasets, [13])).toBe(true);
  });

  it('finds nothing when no dataset holding the Spot is read only', () => {
    expect(isSpotIdInReadOnlyDataset(1, datasets, [14])).toBe(false);
  });
});
