import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, AppState, Platform, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';
import {setCompassMeasurements} from './compass.slice';
import compassStyles from './compass.styles';
import CompassDebug from './CompassDebug';
import CompassFace from './CompassFace';
import useCompassSound from './useCompassSound';
import useCompassCore, {DECLINATION_SOURCE} from '../../services/device/useCompassCore';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {setActiveModal} from '../home/home.slice';
import useDeviceOrientation from '../home/useDeviceOrientation';
import useMeasurements from '../measurements/useMeasurements';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const Compass = ({
                   closeCompass,
                   setAttributeMeasurements,
                   setMeasurements,
                   sliderValue,
                 }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const activeModal = useSelector(state => state.home.activeModal);
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const isSample = useSelector(state => state.spot.selectedSpot.properties?.isSample);

  const {
    compassData,
    fetchDeclination,
    matrixRawData,
    subscribeToCalibrationStatus,
    subscribeToSensors,
    unsubscribeFromCalibrationStatus,
    unsubscribeFromSensors,
  } = useCompassCore();
  const {playCompassSound} = useCompassSound();
  const {lockToPortraitWhileOpen} = useDeviceOrientation();
  const {createNewMeasurement} = useMeasurements();

  /* Local State */

  const hasShownCalibrationAlert = useRef(false);
  const [declinationSource, setDeclinationSource] = useState(null);
  const [isResolvingDeclination, setIsResolvingDeclination] = useState(true);
  const [showCompassRawDataView, setShowCompassRawDataView] = useState(false);

  /* Side Effects */

  useEffect(() => {
    console.log('UE Compass []');
    let isMounted = true;

    // Portrait for the whole compass session (every mode, every device): trend/plunge is measured along the
    // device's top edge, so that has to be the edge at the top of the screen and must not rotate away from it.
    const restoreOrientation = lockToPortraitWhileOpen();

    const startSensors = () => {
      subscribeToSensors();
      subscribeToCalibrationStatus(handleCalibrationStatus);
    };

    // Resolve the declination first (GPS -> project -> centroid -> none), then start the sensors. Starting
    // before it resolves would let Android record magnetic values mislabeled as true north, and a null source
    // means we have no way to reach true north for this measurement, so the compass stays disabled instead.
    fetchDeclination()
      .then(({source}) => {
        if (!isMounted) return; // component unmounted before declination resolved
        setDeclinationSource(source);
        setIsResolvingDeclination(false);
        if (source !== null) startSensors();
      })
      .catch((err) => {
        console.error('Error resolving magnetic declination', err);
        if (!isMounted) return;
        setDeclinationSource(null);
        setIsResolvingDeclination(false);
      });

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      isMounted = false;
      restoreOrientation.then(restore => restore());
      unsubscribeFromSensors();
      unsubscribeFromCalibrationStatus();
      appStateSubscription.remove();
    };
  }, []);

  // Create a new measurement on grabbing new compass measurements from shortcut modal
  useEffect(() => {
    console.log('UE Compass [compassMeasurements]', compassMeasurements);
    if (!isEmpty(compassMeasurements) && activeModal === MODAL_KEYS.SHORTCUTS.MEASUREMENT) {
      console.log('New compass measurement recorded in Measurements.', compassMeasurements);
      createNewMeasurement();
      dispatch(setCompassMeasurements({}));
    }
  }, [compassMeasurements]);

  /* Event Handlers */

  const handleAppStateChange = (state) => {
    if (state === 'background' || state === 'inactive') {
      dispatch(setActiveModal({modal: null}));
      setShowCompassRawDataView(false);
      unsubscribeFromSensors();
    }
  };

  const handleCalibrationStatus = (data) => {
    if (data.needsCalibration === false) {
      hasShownCalibrationAlert.current = false; // Reset flag if calibration is now OK
      return;
    }

    // Only show the alert once per compass session - check and set flag atomically
    if (data.needsCalibration) {
      if (hasShownCalibrationAlert.current) return; // Already shown, ignore this event
      hasShownCalibrationAlert.current = true;  // Set flag IMMEDIATELY before calling alert to prevent race conditions

      // The remedy differs by platform: iOS needs a system setting enabled; Android needs the user to
      // recalibrate the magnetometer (figure-8 motion) and move away from magnetic interference.
      if (Platform.OS === 'ios') {
        alert('Compass Calibration Required',
          'Compass calibration is turned off or needs calibration for accurate orientation measurements. Please enable compass calibration in Settings > Privacy & Security > Location Services > System Services > Compass Calibration.');
      }
      else {
        alert('Compass Needs Calibration',
          'The magnetometer accuracy is low, so orientation measurements may be inaccurate. Wave the device in a figure-8 motion a few times and move away from metal or magnetic objects.');
      }
    }
  };

  /* Logic Helpers */

  const addAttributeMeasurement = (data) => {
    const sliderQuality = sliderValue ? {quality: sliderValue.toString()} : undefined;
    setAttributeMeasurements({...data, ...sliderQuality});
    closeCompass();
  };

  const grabMeasurements = async (isCompassMeasurement) => {
    try {
      if (isCompassMeasurement) {
        if (playCompassSound) playCompassSound();
        const unixTimestamp = Date.now();
        const sliderQuality = !sliderValue || sliderValue === 6 ? {} : {quality: sliderValue.toString()};
        console.log('Compass measurements', compassData, sliderValue);
        if (setAttributeMeasurements) addAttributeMeasurement(compassData);
        else if (setMeasurements) setMeasurements({...compassData, ...sliderQuality, unix_timestamp: unixTimestamp});
        else dispatch(setCompassMeasurements(compassData.quality ? compassData : {...compassData, ...sliderQuality}));
      }
      else dispatch(setCompassMeasurements({...compassData, manual: true}));
    }
    catch (err) {
      console.error('Error grabbing compass measurement', err);
    }
  };

  /* View */

  // The live numbers behind the needle, so the user can read exactly what Tap to Measure will record.
  const renderLiveReading = () => {
    const formatValue = value => (value === null || value === undefined ? '—' : `${value}°`);
    return (
      <>
        {compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR) && (
          <Text style={compassStyles.liveReadingText}>
            Strike {formatValue(compassData.strike)}   Dip {formatValue(compassData.dip)}
          </Text>
        )}
        {compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR) && (
          <Text style={compassStyles.liveReadingText}>
            Trend {formatValue(compassData.trend)}   Plunge {formatValue(compassData.plunge)}
          </Text>
        )}
      </>
    );
  };

  const renderCompassBody = () => {
    if (isResolvingDeclination) {
      return (
        <View style={compassStyles.declinationMessageContainer}>
          <ActivityIndicator size='large'/>
          <Text style={compassStyles.declinationMessageText}>Determining magnetic declination…</Text>
        </View>
      );
    }
    if (declinationSource === null) {
      return (
        <View style={compassStyles.declinationMessageContainer}>
          <Text style={compassStyles.declinationMessageText}>
            Compass unavailable. Magnetic declination cannot be determined here. Turn on Location Services, add a
            location to this Spot, or enter a Magnetic Declination in Project Description, then reopen the compass.
          </Text>
        </View>
      );
    }
    return (
      <>
        {declinationSource === DECLINATION_SOURCE.CENTROID && (
          <View style={compassStyles.declinationWarningBanner}>
            <Text style={compassStyles.declinationWarningText}>
              GPS unavailable — using the location where this {isSample ? 'Sample' : 'Spot'} was created.
              Declination may be less accurate.
            </Text>
          </View>
        )}
        <CompassFace
          compassData={compassData}
          compassMeasurementTypes={compassMeasurementTypes}
          grabMeasurements={grabMeasurements}
        />
        {renderLiveReading()}
        {/* The screen is locked to portrait and trend is taken along the device's top edge, so a user holding the
        device sideways (as landscape support used to allow) needs telling which way to point it. */}
        {compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR) && (
          <Text style={compassStyles.lineationHintText}>Point the top of the screen along the lineation</Text>
        )}
        {showCompassRawDataView && <CompassDebug compassData={compassData} matrixRotation={matrixRawData?.current}/>}
      </>
    );
  };

  return <View style={{flex: 1}}>{renderCompassBody()}</View>;
};

export default Compass;
