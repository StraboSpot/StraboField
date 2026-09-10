import {useRef, useState} from 'react';
import {NativeEventEmitter, Platform} from 'react-native';

import geomagnetism from 'geomagnetism';
import {useSelector} from 'react-redux';

import {cartesianToSpherical, getStrikeAndDip, getTrendAndPlunge, mod, pointingAxisRow} from './compassMath.helpers';
import CompassModule from './CompassModule';
import useMapCoords from '../../modules/maps/view/useMapCoords';
import useMapLocation from '../../modules/maps/view/useMapLocation';
import {updatedProject} from '../../modules/project/projects.slice';
import {isEmpty, roundToDecimalPlaces} from '../../shared/helpers';
import {store} from '../../store/ConfigureStore';

const useCompassCore = () => {
  /* Data Hooks */

  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getCentroidOfSelectedSpot} = useMapCoords();
  const {getCurrentLocation} = useMapLocation();

  /* Local State */

  const calibrationSubscription = useRef(null);
  const imageCapturedDeclination = useRef(0);
  const imageCaptureReference = useRef(null); // 'true' | 'magnetic' — reference frame of the captured matrix (iOS)
  const imageCaptureSubscription = useRef(null);
  const magneticDeclination = useRef(0);
  const matrixRawData = useRef(null);
  const rotationMatrixSubscription = useRef(null);
  const sessionScreenRotation = useRef(null); // hold orientation (0/90/180/270) captured when the compass opened

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
    // Android's matrix is always magnetic-referenced, so JS converts it to true north by adding the
    // declination. iOS is normally true-referenced (CoreMotion did the conversion), so nothing is added —
    // except on devices without GPS, where CoreMotion can't resolve true north and the native layer falls
    // back to a magnetic-referenced matrix (reference: 'magnetic'). There, iOS applies the declination too,
    // exactly like Android, so a manually-entered declination makes the compass correct without GPS.
    const applyDeclination = Platform.OS !== 'ios' || matrixRotationData.reference === 'magnetic';
    const appliedDeclination = applyDeclination ? declination : 0;

    const matrix = Platform.OS === 'ios' ? matrixRotationData.matrix : matrixRotationData;
    matrixRawData.current = matrix;
    // Which hold to use for trend/plunge (0/90/180/270). Only trend/plunge needs it — strike/dip and the
    // camera axis are the screen normal, unchanged by rotating the tablet in its own plane. Captured once
    // when the compass opens and held for the session, matching the locked screen, so tilting the tablet
    // to sight a reading can't flip which edge is treated as "up".
    if (sessionScreenRotation.current == null && matrixRotationData.screenRotation != null) {
      sessionScreenRotation.current = matrixRotationData.screenRotation;
    }
    const screenRotation = sessionScreenRotation.current ?? 0;
    let {magneticHeading, trueHeading} = matrixRotationData;
    if (applyDeclination) trueHeading = mod(magneticHeading + appliedDeclination, 360);
    const {strike, dip} = getStrikeAndDipFromMatrix(matrix, appliedDeclination);
    const {plunge, trend} = getTrendAndPlungeFromMatrix(matrix, appliedDeclination, screenRotation);

    const dipDirection = mod(strike + 90, 360);
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
    // declination is 0 when the frame is already true-referenced (iOS with GPS), non-zero when it must be
    // converted from magnetic (Android always; iOS no-GPS fallback) — the caller resolves which.
    trend = mod(trend + declination, 360);
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
    strike = mod(strike + declination, 360); // declination resolved by caller (0 when already true north)
    return {strike, dip};
  };

  // Uses the in-plane device axis that is "up" for the current hold (see pointingAxisRow) — the edge the
  // user points at the feature. In portrait that's the device's top edge (+Y, the original behavior); in
  // landscape it's whichever long/short edge is up as held, so the reading follows the tablet's orientation
  // instead of forcing portrait. The platform massage (iOS reference frame vs Android ENU) is unchanged.
  const getTrendAndPlungeFromMatrix = (matrix, declination, screenRotation = 0) => {
    const {a, b, c} = pointingAxisRow(matrix, screenRotation);
    const ENU_TP = Platform.OS === 'ios' ? cartesianToSpherical(-b, a, c)
      : cartesianToSpherical(a, b, c);
    let {plunge, trend} = getTrendAndPlunge(ENU_TP);
    trend = mod(trend + declination, 360); // declination resolved by caller (0 when already true north)
    return {plunge, trend};
  };

  // Both platforms now average the rotation matrix natively (iOS in CoreMotion, Android over a rolling
  // window in Compass.java), so there's a single smoothing stage and JS just consumes the result.
  const handleMatrixRotationData = (matrixData) => {
    try {
      computeCompassData(matrixData);
    }
    catch (err) {
      console.error('Error Getting Matrix', err);
    }
  };

  /* Exported Functions */

  const fetchDeclination = async () => {
    // A declination already on the project — manually entered on a GPS-less device, or auto-recorded on a
    // previous fetch — is the source of truth: use it and skip the location lookup, which fails when there's
    // no GPS. This is what lets Wi-Fi-only iPads/tablets work by manual entry.
    const projectDeclination = getProjectDeclination();
    if (projectDeclination !== null) {
      magneticDeclination.current = projectDeclination;
      return projectDeclination;
    }
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
    recordDeclinationToProject(result.decl);
    return result.decl;
  };

  // The declination currently stored on the project, or null when it hasn't been set. A blank field
  // defaults to 0, which we treat as unset — the agonic line (a true 0) is vanishingly rare and still
  // reads as 0, so nothing is lost by re-deriving it from location when GPS is available.
  const getProjectDeclination = () => {
    const {magnetic_declination: stored} = store.getState().project.project?.description ?? {};
    const value = Number(stored);
    return Number.isFinite(value) && value !== 0 ? value : null;
  };

  // Auto-fill the Project Description's Magnetic Declination from the location-derived value, but only when
  // it hasn't been set yet. A value the user typed (or a prior auto-fill) always wins, so the field stays
  // freely editable and we never clobber a manual entry. Read live from the store rather than a hook
  // selector so an async caller doesn't persist against a stale project.
  const recordDeclinationToProject = (declination) => {
    const project = store.getState().project.project;
    if (isEmpty(project) || getProjectDeclination() !== null) return;
    store.dispatch(updatedProject({
      field: 'description',
      value: {...project.description, magnetic_declination: roundToDecimalPlaces(declination, 2)},
    }));
  };

  const getCurrentCameraAngles = () => {
    if (!matrixRawData.current) return {};
    // Same rule as the live compass: apply the declination on Android always, and on iOS only when the
    // captured frame was magnetic-referenced (no-GPS fallback); an iOS true-north frame needs no offset.
    const applyDeclination = Platform.OS !== 'ios' || imageCaptureReference.current === 'magnetic';
    const declination = applyDeclination ? imageCapturedDeclination.current : 0;
    const {plunge, trend} = getCameraViewFromMatrix(matrixRawData.current, declination);
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
        imageCaptureReference.current = matrixData.reference;
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

  // Both platforms emit compassCalibrationStatus now: iOS when CoreMotion can't get true north, Android
  // when the magnetometer reports low/unreliable accuracy.
  const subscribeToCalibrationStatus = (handler) => {
    try {
      const CompassEvents = new NativeEventEmitter(CompassModule);
      calibrationSubscription.current = CompassEvents.addListener('compassCalibrationStatus', handler);
    }
    catch (err) {
      console.error('Error subscribing to calibration status: ' + err);
    }
  };

  const subscribeToSensors = () => {
    try {
      sessionScreenRotation.current = null; // re-latch the hold for this fresh compass session
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
    try {
      calibrationSubscription.current?.remove();
      console.log('%cEnded compass calibration status listener.', 'color: red');
    }
    catch (err) {
      console.error('Error unsubscribing from calibration status', err);
    }
  };

  const unsubscribeFromSensors = () => {
    try {
      rotationMatrixSubscription.current?.remove();
      sessionScreenRotation.current = null;
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
