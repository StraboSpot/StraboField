import {isEmpty, roundToDecimalPlaces, toDegrees, toRadians} from '../../shared/helpers';
import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';

// What a form calls its strike and dip direction when it takes a single orientation, and so has no measurement
// groups to tell one from another
const DEFAULT_ORIENTATION_FIELDS = [{dip_direction: 'dip_direction', strike: 'strike'}];

// A form that does name its orientations by group, such as the 3D structures, passes in the field to fill
export const calcDipDir = (strike, formRefCurrent, dipDirectionKey = 'dip_direction') => {
  console.log('Calculating dip direction...');
  let dipDirection = (strike + 90) % 360;
  formRefCurrent.setFieldValue(dipDirectionKey, roundToDecimalPlaces(dipDirection, 0));
};

export const calcStrike = (dipDirection, formRefCurrent, strikeKey = 'strike') => {
  console.log('Calculating strike...');
  let strike = dipDirection - 90;
  if (strike < 0) strike = 360 + strike;
  formRefCurrent.setFieldValue(strikeKey, roundToDecimalPlaces(strike, 0));
};

export const calcTrendPlunge = (rake, formRefCurrent, selectedAttitude) => {
  console.log('Calculating trend and plunge...');
  const strike = selectedAttitude.strike;
  const dip = selectedAttitude.dip;
  let trend;
  const beta = toDegrees(Math.atan(Math.tan(toRadians(rake)) * Math.cos(toRadians(dip))));
  if (rake <= 90) trend = strike + beta;
  else {
    trend = 180 + strike + beta;
    if (trend >= 360) trend = trend - 360;
  }
  const plunge = toDegrees(Math.asin(Math.sin(toRadians(dip)) * Math.sin(toRadians(rake))));
  formRefCurrent.setFieldValue('trend', roundToDecimalPlaces(trend, 0));
  formRefCurrent.setFieldValue('plunge', roundToDecimalPlaces(plunge, 0));
};

export const formatDeg = val => `${roundToDecimalPlaces(val ?? 0, 1)}°`;

// Reduce the measurement groups a form defines to the strike and dip direction fields that pair up
export const getOrientationFields = (measurementsKeys) => {
  return Object.values(measurementsKeys).filter(group => group.strike && group.dip_direction)
    .map(group => ({dip_direction: group.dip_direction, strike: group.strike}));
};

// A rake gives a trend and plunge only for a linear measurement taken on the plane of another measurement
const isRakeCalculable = (rake, selectedAttitude, selectedMeasurement) => {
  return selectedMeasurement?.type === MEASUREMENT_KEYS.LINEAR && selectedAttitude?.id !== selectedMeasurement?.id
    && !isEmpty(selectedAttitude?.strike) && !isEmpty(selectedAttitude?.dip) && rake >= 0 && rake <= 180;
};

// Entering a strike fills in the dip direction of the same orientation and the reverse, and entering a rake fills
// in the trend and plunge. A field that takes part in no calculation is set as it would be with no override at all,
// left as it was typed rather than read as a number, so a decimal field can still be typed into.
export const setOrientationFieldValue = (formCurrent, name, value, options = {}) => {
  const {orientationFields = DEFAULT_ORIENTATION_FIELDS, selectedAttitude, selectedMeasurement} = options;
  const pairedFields = orientationFields.find(f => f.dip_direction === name || f.strike === name);
  const valueAsFloat = parseFloat(value);
  if (!pairedFields && name !== 'rake') formCurrent.setFieldValue(name, value);
  else if (isNaN(valueAsFloat)) formCurrent.setFieldValue(name, undefined);
  else {
    if (name === 'rake' && isRakeCalculable(valueAsFloat, selectedAttitude, selectedMeasurement)) {
      calcTrendPlunge(valueAsFloat, formCurrent, selectedAttitude);
    }
    // A value out of range fills in nothing, leaving the constraint error to show against what was typed
    else if (pairedFields && valueAsFloat >= 0 && valueAsFloat <= 360) {
      if (name === pairedFields.strike) calcDipDir(valueAsFloat, formCurrent, pairedFields.dip_direction);
      else calcStrike(valueAsFloat, formCurrent, pairedFields.strike);
    }
    formCurrent.setFieldValue(name, valueAsFloat);
  }
};
