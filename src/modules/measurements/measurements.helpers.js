import {FIRST_ORDER_CLASS_FIELDS, MEASUREMENT_KEYS, SECOND_ORDER_CLASS_FIELDS} from './measurements.constants';
import {isEmpty, toTitleCase} from '../../shared/helpers';

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

// The measurements each section of the Measurements page shows, newest first. Carrying associated
// orientations is what makes a measurement Planar + Linear, whatever its own type says.
export const getMeasurementsBySection = (orientationData) => {
  const sections = {PLANAR: [], LINEAR: [], PLANARLINEAR: []};
  (orientationData || []).forEach((meas) => {
    if (meas?.associated_orientation) sections.PLANARLINEAR.unshift(meas);
    else if (isPlanarType(meas?.type)) sections.PLANAR.unshift(meas);
    else if (meas?.type === MEASUREMENT_KEYS.LINEAR) sections.LINEAR.unshift(meas);
  });
  return sections;
};

// The same measurements in the same order, for a list that shows them without the section headers
export const getMeasurementsInSectionOrder = orientationData => Object.values(
  getMeasurementsBySection(orientationData)).flat();

// The measurements a Spot draws on the map. What the map draws and what the map symbols menu offers a toggle
// for have to agree, so both ask here rather than each testing the flag.
export const getVisibleMeasurements = orientationData => (orientationData || []).filter(
  meas => !meas?.isHiddenOnMap);

// The descriptive half of a measurement's title - what kind of feature it is, without the orientation numbers,
// which are read off the measurement at render time so they follow the user's measurement convention.
// getLabel is passed in because a plain helper cannot call useForm.
export const getMeasurementTypeText = (measurement, getLabel) => {
  const firstOrderClass = FIRST_ORDER_CLASS_FIELDS.find(firstOrderClassField => measurement[firstOrderClassField]);
  const secondOrderClass = SECOND_ORDER_CLASS_FIELDS.find(
    secondOrderClassField => measurement[secondOrderClassField]);
  let firstOrderClassLabel = firstOrderClass
    ? toTitleCase(getLabel(measurement[firstOrderClass], ['measurement']))
    : 'Unknown';
  firstOrderClassLabel = firstOrderClassLabel.replace('Orientation', 'Feature');
  if (firstOrderClassLabel === 'Tabular Feature') firstOrderClassLabel = 'Planar Feature (TZ)';
  const secondOrderClassLabel = secondOrderClass
    && getLabel(measurement[secondOrderClass], ['measurement']).toUpperCase();
  return firstOrderClassLabel + (secondOrderClass ? ' - ' + secondOrderClassLabel : '');
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
