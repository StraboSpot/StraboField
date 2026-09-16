import {MEASUREMENT_KEYS} from './measurements.constants';
import {isEmpty} from '../../shared/helpers';

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

export const isEmptyMeasurement = (measurement) => {
  return isEmpty(measurement)
    || (!isEmpty(measurement) && ((Object.keys(measurement).length === 2 && measurement.id && measurement.type)
      || (Object.keys(measurement).length === 3 && measurement.id && measurement.type
        && measurement.associated_orientation
        && isEmpty(measurement.associated_orientation.filter(aO => !isEmptyMeasurement(aO))))));
};

// A tabular zone is a plane with a thickness, so it is read, labeled and edited as a planar orientation
export const isPlanarType = type => type === MEASUREMENT_KEYS.PLANAR || type === MEASUREMENT_KEYS.TABULAR;
