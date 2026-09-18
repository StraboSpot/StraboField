import {MEASUREMENT_KEYS} from './measurements.constants';
import {getMeasurementsBySection, getMeasurementsInSectionOrder} from './measurements.helpers';

const planar = {id: 'p1', type: MEASUREMENT_KEYS.PLANAR};
const tabular = {id: 't1', type: MEASUREMENT_KEYS.TABULAR};
const linear = {id: 'l1', type: MEASUREMENT_KEYS.LINEAR};
const planarWithLinear = {associated_orientation: [linear], id: 'pl1', type: MEASUREMENT_KEYS.PLANAR};

// The Measurements page groups into sections and the Measurements overview lists the same measurements flat,
// so both read their order from here rather than each working it out and drifting apart
describe('getMeasurementsBySection', () => {
  it('puts a plane and a tabular zone in the planar section', () => {
    expect(getMeasurementsBySection([planar, tabular]).PLANAR.map(meas => meas.id)).toEqual(['t1', 'p1']);
  });

  it('puts a line in the linear section', () => {
    expect(getMeasurementsBySection([planar, linear]).LINEAR.map(meas => meas.id)).toEqual(['l1']);
  });

  // Associated orientations are what make a measurement Planar + Linear, so one must not also show in the
  // section its own type would otherwise put it in
  it('puts a measurement with associated orientations only in the planar + linear section', () => {
    const sections = getMeasurementsBySection([planarWithLinear]);
    expect(sections.PLANARLINEAR.map(meas => meas.id)).toEqual(['pl1']);
    expect(sections.PLANAR).toEqual([]);
  });

  // An empty associated_orientation still counts as carrying one, as it did before the grouping moved here
  it('treats an empty associated_orientation as planar + linear', () => {
    const emptyAssociated = {associated_orientation: [], id: 'pl2', type: MEASUREMENT_KEYS.PLANAR};
    expect(getMeasurementsBySection([emptyAssociated]).PLANARLINEAR.map(meas => meas.id)).toEqual(['pl2']);
  });

  it('lists the newest measurement in a section first', () => {
    const newer = {id: 'p2', type: MEASUREMENT_KEYS.PLANAR};
    expect(getMeasurementsBySection([planar, newer]).PLANAR.map(meas => meas.id)).toEqual(['p2', 'p1']);
  });

  it('gives every section for a Spot with no measurements at all', () => {
    expect(getMeasurementsBySection(undefined)).toEqual({LINEAR: [], PLANAR: [], PLANARLINEAR: []});
  });
});

describe('getMeasurementsInSectionOrder', () => {
  it('runs the sections in the order the Measurements page shows them', () => {
    const ordered = getMeasurementsInSectionOrder([linear, planarWithLinear, planar]);
    expect(ordered.map(meas => meas.id)).toEqual(['p1', 'l1', 'pl1']);
  });

  it('gives an empty list for a Spot with no measurements at all', () => {
    expect(getMeasurementsInSectionOrder(undefined)).toEqual([]);
  });
});
