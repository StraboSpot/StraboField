import {calcDipDir, calcStrike, calcTrendPlunge} from './compass.helpers';
import {isEmpty} from '../../shared/Helpers';
import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';

const useCompassCalculations = () => {
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
