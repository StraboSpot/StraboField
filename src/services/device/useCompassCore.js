import {useRef, useState} from 'react';
import {NativeEventEmitter, Platform} from 'react-native';

import geomagnetism from 'geomagnetism';
import {useSelector} from 'react-redux';

import {cartesianToSpherical, getStrikeAndDip, getTrendAndPlunge, mod, pointingAxisRow} from './compassMath.helpers';
import CompassModule from './CompassModule';
import useMapCoords from '../../modules/maps/view/useMapCoords';
import useMapLocation from '../../modules/maps/view/useMapLocation';
import {updatedProject} from '../../modules/project/projects.slice';
import {isOnGeoMap} from '../../modules/spots/spots.helpers';
import useSpots from '../../modules/spots/useSpots';
import {isEmpty, roundToDecimalPlaces} from '../../shared/helpers';
import {store} from '../../store/ConfigureStore';

// Where a resolved declination came from, in priority order. null means it could not be resolved and the
// compass should be disabled for the measurement.
export const DECLINATION_SOURCE = {CENTROID: 'centroid', GPS: 'gps', PROJECT: 'project'};

const useCompassCore = () => {
  /* Data Hooks */

  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getCentroidOfSelectedSpot} = useMapCoords();
  const {getCurrentLocation} = useMapLocation();
  const {getRootSpotGeoCoords} = useSpots();

  /* Local State */

  const calibrationSubscription = useRef(null);
  const declinationSource = useRef(null); // which fallback the applied declination came from, recorded on the measurement
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
      declination_source: declinationSource.current,
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

  // Resolve the declination to apply to a measurement, following the fallback order:
  //   1. Live device GPS - matches exactly where the measurement is taken.
  //   2. A declination recorded on the project (e.g. manually entered on a GPS-less device).
  //   3. The centroid of the Spot itself, or its nearest geographic parent - less precise, so the caller
  //      warns that the feature's creation location is being used.
  //   4. Nothing to derive from - the caller disables the compass until a location or declination exists.
  // Returns {declination, source}; source is null (declination null) only in the disabled case.
  const fetchDeclination = async () => {
    // 1. Live GPS. Stay silent when location is blocked/unavailable - we have fallbacks and shouldn't nag a
    // GPS-less device on every compass open.
    try {
      const {longitude, latitude} = await getCurrentLocation({showBlockedAlert: false});
      const declination = declinationAtCoords([longitude, latitude]);
      magneticDeclination.current = declination;
      declinationSource.current = DECLINATION_SOURCE.GPS;
      recordDeclinationToProject(declination); // seed the project reference while it is still empty
      return {declination, source: DECLINATION_SOURCE.GPS};
    }
    catch (err) {
      console.log('No live GPS for declination; trying fallbacks', err);
    }

    // 2. A declination already recorded on the project.
    const projectDeclination = getProjectDeclination();
    if (projectDeclination !== null) {
      magneticDeclination.current = projectDeclination;
      declinationSource.current = DECLINATION_SOURCE.PROJECT;
      return {declination: projectDeclination, source: DECLINATION_SOURCE.PROJECT};
    }

    // 3. Centroid of the selected Spot or its nearest geographic parent.
    const geoCoords = getSpotGeoCoords();
    if (geoCoords) {
      const declination = declinationAtCoords(geoCoords);
      magneticDeclination.current = declination;
      declinationSource.current = DECLINATION_SOURCE.CENTROID;
      recordDeclinationToProject(declination);
      return {declination, source: DECLINATION_SOURCE.CENTROID};
    }

    // 4. Nothing available - the compass can't produce a true-north reading for this measurement.
    declinationSource.current = null;
    return {declination: null, source: null};
  };

  const declinationAtCoords = ([longitude, latitude]) => {
    const result = geomagnetism.model().point([latitude, longitude]);
    console.log('MagDeclination', result);
    return roundToDecimalPlaces(result.decl, 2);
  };

  // Real-world [lng, lat] for the selected Spot: its own centroid when it's on the geographic map, otherwise
  // the nearest parent Spot's location (a Spot on an image basemap or strat section has pixel coordinates, not
  // lng/lat). Returns undefined when neither the Spot nor any parent has a geographic location.
  const getSpotGeoCoords = () => {
    if (isEmpty(selectedSpot)) return undefined;
    if (isOnGeoMap(selectedSpot)) return isEmpty(selectedSpot.geometry) ? undefined : getCentroidOfSelectedSpot();
    return getRootSpotGeoCoords(selectedSpot.properties.image_basemap, selectedSpot.properties.strat_section_id);
  };

  // The declination currently stored on the project, or null when it hasn't been set. A blank field
  // defaults to 0, which we treat as unset — the agonic line (a true 0) is vanishingly rare and still
  // reads as 0, so nothing is lost by re-deriving it from location when GPS is available.
  const getProjectDeclination = () => {
    const {magnetic_declination: stored} = store.getState().project.project?.description ?? {};
    const value = Number(stored);
    return Number.isFinite(value) && value !== 0 ? value : null;
  };

  // Record the location-derived declination on the Project Description as a reference value, but only when
  // the field hasn't been set yet. A value the user typed (or a prior auto-fill) always wins, so the field
  // stays freely editable and we never clobber a manual entry. Read live from the store rather than a hook
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
      const {declination} = await fetchDeclination();
      imageCapturedDeclination.current = declination ?? 0;
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
