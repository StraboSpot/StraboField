import {useRef, useState} from 'react';
import {NativeEventEmitter, Platform} from 'react-native';

import geomagnetism from 'geomagnetism';
import {useSelector} from 'react-redux';

import {cartesianToSpherical, getStrikeAndDip, getTrendAndPlunge} from './compassMath.helpers';
import CompassModule from './CompassModule';
import useMapCoords from '../../modules/maps/useMapCoords';
import useMapLocation from '../../modules/maps/useMapLocation';
import {isEmpty, roundToDecimalPlaces} from '../../shared/helpers';

let matrixArray = [];

const useCompassCore = () => {
  /* Data Hooks */

  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getCentroidOfSelectedSpot} = useMapCoords();
  const {getCurrentLocation} = useMapLocation();

  /* Local State */

  const calibrationSubscription = useRef(null);
  const imageCapturedDeclination = useRef(0);
  const imageCaptureSubscription = useRef(null);
  const magneticDeclination = useRef(0);
  const matrixRawData = useRef(null);
  const rotationMatrixSubscription = useRef(null);

  const [compassData, setCompassData] = useState({
    dip: null,
    dip_direction: null,
    magDecStrike: 0,
    magDecTrend: 0,
    magHeading: 0,
    plunge: null,
    quality: null,
    rake: null,
    rake_calculated: 'yes',
    strike: 0,
    trend: 0,
    trueHeading: 0,
  });

  /* Internal Functions */

  const computeCompassData = (matrixRotationData) => {
    const declination = magneticDeclination.current;

    const matrix = Platform.OS === 'ios' ? matrixRotationData.matrix : matrixRotationData;
    matrixRawData.current = matrix;
    let {magneticHeading, trueHeading} = matrixRotationData;
    if (Platform.OS !== 'ios') trueHeading = (magneticHeading + declination) % 360;
    const {strike, dip} = getStrikeAndDipFromMatrix(matrix, declination);
    const {plunge, trend} = getTrendAndPlungeFromMatrix(matrix, declination);

    const dipDirection = (strike + 90) % 360;
    setCompassData({
      declination: declination.toFixed(2),
      dip: roundToDecimalPlaces(dip, 0),
      dip_direction: roundToDecimalPlaces(dipDirection, 0),
      magHeading: roundToDecimalPlaces(magneticHeading, 0),
      plunge: roundToDecimalPlaces(plunge, 0),
      strike: roundToDecimalPlaces(strike, 0),
      trend: roundToDecimalPlaces(trend, 0),
      trueHeading: roundToDecimalPlaces(trueHeading, 0),
    });
  };

  // Uses the -Z axis (negated m3x row) — the back camera's optical axis.
  // Unlike strike/dip which uses +Z (screen normal), or trend/plunge which uses Y (long edge toward target),
  // the camera points through the back of the device, perpendicular to the screen and away from the user.
  const getCameraViewFromMatrix = (matrix, declination) => {
    const {m31, m32, m33} = matrix;
    const ENU_Cam = Platform.OS === 'ios' ? cartesianToSpherical(m32, -m31, -m33)
      : cartesianToSpherical(-m31, -m32, -m33);
    let {plunge, trend} = getTrendAndPlunge(ENU_Cam);
    if (Platform.OS !== 'ios') trend = (trend + declination) % 360;
    return {plunge, trend};
  };

  // Uses the Z axis (m3x row) as the pole (normal) to the measured plane.
  // Device is held back-against-rock with the screen facing the user; Z points out perpendicular to the rock surface.
  // Strike and dip are derived from this pole direction, not measured directly along Z.
  const getStrikeAndDipFromMatrix = (matrix, declination) => {
    const {m31, m32, m33} = matrix;
    const ENU_Pole = Platform.OS === 'ios' ? cartesianToSpherical(-m32, m31, m33)
      : cartesianToSpherical(m31, m32, m33);
    let {strike, dip} = getStrikeAndDip(ENU_Pole);
    if (Platform.OS !== 'ios') strike = (strike + declination) % 360;
    return {strike, dip};
  };

  // Uses the Y axis (m2x row) — the device's long axis (toward the top edge).
  // Device is pointed at the feature being measured, so Y points toward the target.
  const getTrendAndPlungeFromMatrix = (matrix, declination) => {
    const {m21, m22, m23} = matrix;
    const ENU_TP = Platform.OS === 'ios' ? cartesianToSpherical(-m22, m21, m23)
      : cartesianToSpherical(m21, m22, m23);
    let {plunge, trend} = getTrendAndPlunge(ENU_TP);
    if (Platform.OS !== 'ios') trend = (trend + declination) % 360;
    return {plunge, trend};
  };

  const handleMatrixRotationData = async (matrixData) => {
    try {
      if (Platform.OS === 'android') matrixData = await matrixAverage(matrixData);
      computeCompassData(matrixData);
    }
    catch (err) {
      console.error('Error Getting Matrix', err);
    }
  };

  const matrixAverage = async (matrixData) => {
    matrixArray.push(matrixData);
    if (matrixArray.length > 5) matrixArray.shift();

    const avg = key => matrixArray.reduce((sum, obj) => sum + obj[key] / matrixArray.length, 0);
    return {
      m11: roundToDecimalPlaces(avg('m11'), 3),
      m12: roundToDecimalPlaces(avg('m12'), 3),
      m13: roundToDecimalPlaces(avg('m13'), 3),
      m21: roundToDecimalPlaces(avg('m21'), 3),
      m22: roundToDecimalPlaces(avg('m22'), 3),
      m23: roundToDecimalPlaces(avg('m23'), 3),
      m31: roundToDecimalPlaces(avg('m31'), 3),
      m32: roundToDecimalPlaces(avg('m32'), 3),
      m33: roundToDecimalPlaces(avg('m33'), 3),
      magneticHeading: roundToDecimalPlaces(matrixData.magneticHeading, 0),
    };
  };

  /* Exported Functions */

  const fetchDeclination = async () => {
    let longitude, latitude;
    if (!isEmpty(selectedSpot)) [longitude, latitude] = getCentroidOfSelectedSpot();
    else {
      const locationData = await getCurrentLocation();
      longitude = locationData.longitude;
      latitude = locationData.latitude;
    }
    const result = geomagnetism.model().point([latitude, longitude]);
    console.log('MagDeclination', result);
    magneticDeclination.current = result.decl;
    return result.decl;
  };

  const getCurrentCameraAngles = () => {
    if (!matrixRawData.current) return {};
    const {plunge, trend} = getCameraViewFromMatrix(matrixRawData.current, imageCapturedDeclination.current);
    return {
      view_angle_plunge: roundToDecimalPlaces(plunge, 0),
      view_azimuth_trend: roundToDecimalPlaces(trend, 0),
    };
  };

  const startCameraAnglesCapture = async () => {
    try {
      imageCapturedDeclination.current = await fetchDeclination();
      const CompassEvents = new NativeEventEmitter(CompassModule);
      imageCaptureSubscription.current = CompassEvents.addListener('rotationMatrix', (matrixData) => {
        matrixRawData.current = Platform.OS === 'ios' ? matrixData.matrix : matrixData;
      });
      Platform.OS === 'ios' ? CompassModule.startCompass() : CompassModule.startSensors();
    }
    catch (err) {
      console.error('Error starting image view capture:', err);
    }
  };

  const stopCameraAnglesCapture = () => {
    imageCaptureSubscription.current?.remove();
    imageCaptureSubscription.current = null;
    Platform.OS === 'ios' ? CompassModule.stopCompass() : CompassModule.stopSensors();
  };

  const subscribeToCalibrationStatus = (handler) => {
    if (Platform.OS === 'ios') {
      try {
        const CompassEvents = new NativeEventEmitter(CompassModule);
        calibrationSubscription.current = CompassEvents.addListener('compassCalibrationStatus', handler);
      }
      catch (err) {
        console.error('Error subscribing to calibration status: ' + err);
      }
    }
  };

  const subscribeToSensors = () => {
    try {
      const CompassEvents = new NativeEventEmitter(CompassModule);
      rotationMatrixSubscription.current = CompassEvents.addListener('rotationMatrix', handleMatrixRotationData);
      Platform.OS === 'ios' ? CompassModule.startCompass() : CompassModule.startSensors();
      console.log('%cSUBSCRIBING to native compass data!', 'color: green');
    }
    catch (err) {
      console.error('Error subscribing to the native data: ' + err);
    }
  };

  const unsubscribeFromCalibrationStatus = () => {
    if (Platform.OS === 'ios') {
      try {
        calibrationSubscription.current?.remove();
        console.log('%cEnded compass calibration status listener.', 'color: red');
      }
      catch (err) {
        console.error('Error unsubscribing from calibration status', err);
      }
    }
  };

  const unsubscribeFromSensors = () => {
    try {
      rotationMatrixSubscription.current?.remove();
      Platform.OS === 'ios' ? CompassModule.stopCompass() : CompassModule.stopSensors();
      console.log('%cEnded Compass observation and rotationMatrix listener.', 'color: red');
    }
    catch (err) {
      console.error('Error unsubscribing from compass events', err);
    }
  };

  return {
    compassData,
    fetchDeclination,
    getCurrentCameraAngles,
    matrixRawData,
    startCameraAnglesCapture,
    stopCameraAnglesCapture,
    subscribeToCalibrationStatus,
    subscribeToSensors,
    unsubscribeFromCalibrationStatus,
    unsubscribeFromSensors,
  };
};

export default useCompassCore;
