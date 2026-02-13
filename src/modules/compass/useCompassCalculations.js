import {isEmpty, roundToDecimalPlaces, toDegrees, toRadians} from '../../shared/Helpers';
import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';

const useCompassCalculations = () => {
  /* Internal Functions */

  const calcDipDir = (strike, formRefCurrent) => {
    console.log('Calculating dip direction...');
    let dipDirection = (strike + 90) % 360;
    formRefCurrent.setFieldValue('dip_direction', roundToDecimalPlaces(dipDirection, 0));
  };

  const calcStrike = (dipDirection, formRefCurrent) => {
    console.log('Calculating strike...');
    let strike = dipDirection - 90;
    if (strike < 0) strike = 360 + strike;
    formRefCurrent.setFieldValue('strike', roundToDecimalPlaces(strike, 0));
  };

  const calcTrendPlunge = (rake, formRefCurrent, selectedAttitude) => {
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

  /* Exported Functions */

  const doMeasurementCalculations = async (name, value, formRefCurrent, selectedAttitude, selectedMeasurement) => {
    //console.log(name, 'changed to', value);
    if (name === 'rake' && !isEmpty(value) && selectedMeasurement.type === MEASUREMENT_KEYS.LINEAR
      && selectedAttitude.id !== selectedMeasurement.id && !isEmpty(selectedAttitude.strike)
      && !isEmpty(selectedAttitude.dip) && value >= 0 && value <= 180) {
      calcTrendPlunge(value, formRefCurrent, selectedAttitude);
    }
    else if (name === 'strike' && !isEmpty(value) && value >= 0 && value <= 360) {
      calcDipDir(value, formRefCurrent);
    }
    else if (name === 'dip_direction' && !isEmpty(value) && value >= 0 && value <= 360) {
      calcStrike(value, formRefCurrent);
    }
    await formRefCurrent.setFieldValue(name, value);
  };

  return {
    doMeasurementCalculations,
  };
};

export default useCompassCalculations;
