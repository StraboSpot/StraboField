import {isEmpty} from '../../shared/Helpers';

export const equalsIgnoreOrder = (a, b) => {
  if (a.length !== b.length) return false;
  const uniqueValues = new Set([...a, ...b]);
  for (const v of uniqueValues) {
    const aCount = a.filter(e => e === v).length;
    const bCount = b.filter(e => e === v).length;
    if (aCount !== bCount) return false;
  }
  return true;
};

export const getLinearTemplates = templatesToFilter => templatesToFilter.filter(
  t => t.values?.type === 'linear_orientation' || t.type === 'linear_orientation');

export const getPlanarTemplates = templatesToFilter => templatesToFilter.filter(
  t => t.values?.type === 'planar_orientation' || t.values?.type === 'tabular_orientation' || t.type === 'planar_orientation');

export const isEmptyMeasurement = (measurement) => {
  return isEmpty(measurement)
    || (!isEmpty(measurement) && ((Object.keys(measurement).length === 2 && measurement.id && measurement.type)
      || (Object.keys(measurement).length === 3 && measurement.id && measurement.type
        && measurement.associated_orientation
        && isEmpty(measurement.associated_orientation.filter(aO => !isEmptyMeasurement(aO))))));
};
