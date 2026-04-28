import geomagnetism from 'geomagnetism';
import {useSelector} from 'react-redux';

import {cartesianToSpherical, getHeading, getStrikeAndDip, getTrendAndPlunge} from './compass.helpers';
import useMapCoords from '../../modules/maps/useMapCoords';
import useMapLocation from '../../modules/maps/useMapLocation';
import {isEmpty, roundToDecimalPlaces} from '../../shared/Helpers';

let matrixArray = [];

const useCompass = () => {
  /* Data Hooks */

  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getCentroidOfSelectedSpot} = useMapCoords();
  const {getCurrentLocation} = useMapLocation();

  /* Exported Functions */

  const getUserDeclination = async () => {
    let longitude, latitude;
    if (!isEmpty(selectedSpot)) [longitude, latitude] = getCentroidOfSelectedSpot();
    else {
      const locationData = await getCurrentLocation();
      longitude = locationData.longitude;
      latitude = locationData.latitude;
    }
    const magneticDeclination = geomagnetism.model().point([latitude, longitude]);
    console.log('MagDeclination', magneticDeclination);
    return magneticDeclination.decl;
  };

  const matrixAverage = async (matrixData) => {
    matrixArray.push(matrixData);

    if (matrixArray.length > 5) {
      matrixArray.shift();
    }
    const m11Avg = matrixArray.reduce((sum, obj) => sum + obj.m11 / matrixArray.length, 0);
    const m12Avg = matrixArray.reduce((sum, obj) => sum + obj.m12 / matrixArray.length, 0);
    const m13Avg = matrixArray.reduce((sum, obj) => sum + obj.m13 / matrixArray.length, 0);
    const m21Avg = matrixArray.reduce((sum, obj) => sum + obj.m21 / matrixArray.length, 0);
    const m22Avg = matrixArray.reduce((sum, obj) => sum + obj.m22 / matrixArray.length, 0);
    const m23Avg = matrixArray.reduce((sum, obj) => sum + obj.m23 / matrixArray.length, 0);
    const m31Avg = matrixArray.reduce((sum, obj) => sum + obj.m31 / matrixArray.length, 0);
    const m32Avg = matrixArray.reduce((sum, obj) => sum + obj.m32 / matrixArray.length, 0);
    const m33Avg = matrixArray.reduce((sum, obj) => sum + obj.m33 / matrixArray.length, 0);
    // const trueHeadingAvg = matrixArray.reduce((sum, obj) => sum + obj.trueHeading / matrixArray.length, 0);

    const newMatrixObject = {
      m11: roundToDecimalPlaces(m11Avg, 3),
      m12: roundToDecimalPlaces(m12Avg, 3),
      m13: roundToDecimalPlaces(m13Avg, 3),
      m21: roundToDecimalPlaces(m21Avg, 3),
      m22: roundToDecimalPlaces(m22Avg, 3),
      m23: roundToDecimalPlaces(m23Avg, 3),
      m31: roundToDecimalPlaces(m31Avg, 3),
      m32: roundToDecimalPlaces(m32Avg, 3),
      m33: roundToDecimalPlaces(m33Avg, 3),
      magneticHeading: roundToDecimalPlaces(matrixData.magneticHeading, 0),
    };
    return newMatrixObject;
  };

  return {
    cartesianToSpherical,
    getHeading,
    getStrikeAndDip,
    getTrendAndPlunge,
    getUserDeclination,
    matrixAverage,
  };
};

export default useCompass;
