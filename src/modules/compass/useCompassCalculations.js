import {isEmpty, roundToDecimalPlaces, toDegrees, toRadians} from '../../shared/Helpers';
import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';

const useCompassCalculations = ({formRefCurrent, selectedAttitude, selectedMeasurement}) => {

  const calcDipDir = (strike) => {
    console.log('Calculating dip direction...');
    let dipDirection = strike + 90;
    if (dipDirection >= 360) dipDirection = dipDirection - 360;
    formRefCurrent.setFieldValue('dip_direction', roundToDecimalPlaces(dipDirection, 0));
  };

  const calcStrike = (dipDirection) => {
    console.log('Calculating strike...');
    let strike = dipDirection - 90;
    if (strike < 0) strike = 360 + strike;
    formRefCurrent.setFieldValue('strike', roundToDecimalPlaces(strike, 0));
  };

  const calcTrendPlunge = (rake) => {
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

  const onMyChange = async (name, value) => {
    //console.log(name, 'changed to', value);
    const valueAsInt = parseInt(value, 10);
    if (name === 'rake' && !isEmpty(value) && selectedMeasurement.type === MEASUREMENT_KEYS.LINEAR
      && selectedAttitude.id !== selectedMeasurement.id && !isEmpty(selectedAttitude.strike)
      && !isEmpty(selectedAttitude.dip) && valueAsInt >= 0 && valueAsInt <= 180) calcTrendPlunge(valueAsInt);
    if (name === 'strike' && !isEmpty(valueAsInt) && valueAsInt >= 0 && valueAsInt <= 360) calcDipDir(valueAsInt);
    if (name === 'dip_direction' && !isEmpty(valueAsInt) && valueAsInt >= 0 && valueAsInt <= 360) calcStrike(valueAsInt);
    await formRefCurrent.setFieldValue(name, value);
  };

  return {
    onMyChange: onMyChange,
  };
};

export default useCompassCalculations;
