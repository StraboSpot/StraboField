import {calculateMissingOrientations, getSpotOrientations} from './spots.helpers';
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
