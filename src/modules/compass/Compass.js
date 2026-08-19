import React, {useEffect, useRef, useState} from 'react';
import {AppState, Platform, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {setCompassMeasurements} from './compass.slice';
import CompassDebug from './CompassDebug';
import CompassFace from './CompassFace';
import useCompassSound from './useCompassSound';
import useCompassCore from '../../services/device/useCompassCore';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {setModalVisible} from '../home/home.slice';
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
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const modalVisible = useSelector(state => state.home.modalVisible);

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
  const {createNewMeasurement} = useMeasurements();

  /* Local State */

  const hasShownCalibrationAlert = useRef(false);
  const [showCompassRawDataView, setShowCompassRawDataView] = useState(false);

  /* Side Effects */

  useEffect(() => {
    console.log('UE Compass []');
    fetchDeclination().catch((err) => {
      console.error('Magnetic Declination not available', err);
      const errorMessage = err.message || err;
      if (errorMessage.includes('Location permission') || errorMessage.includes('location')) {
        alert('Location Services Required',
          'Location services are needed to calculate magnetic declination for accurate orientation measurements. Please enable location services in your device settings.');
      }
    });
    subscribeToSensors();
    subscribeToCalibrationStatus(handleCalibrationStatus);
    AppState.addEventListener('change', handleAppStateChange);
    return () => {
      unsubscribeFromSensors();
      unsubscribeFromCalibrationStatus();
      AppState.addEventListener(
        'change',
        () => console.log('APP STATE EVENT REMOVED IN COMPASS')).remove();
    };
  }, []);

  // Create a new measurement on grabbing new compass measurements from shortcut modal
  useEffect(() => {
    console.log('UE Compass [compassMeasurements]', compassMeasurements);
    if (!isEmpty(compassMeasurements) && modalVisible === MODAL_KEYS.SHORTCUTS.MEASUREMENT) {
      console.log('New compass measurement recorded in Measurements.', compassMeasurements);
      createNewMeasurement();
      dispatch(setCompassMeasurements({}));
    }
  }, [compassMeasurements]);

  /* Event Handlers */

  const handleAppStateChange = (state) => {
    if (state === 'background' || state === 'inactive') {
      dispatch(setModalVisible({modal: null}));
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
    if (data.needsCalibration && Platform.OS === 'ios') {
      if (hasShownCalibrationAlert.current) return; // Already shown, ignore this event
      hasShownCalibrationAlert.current = true;  // Set flag IMMEDIATELY before calling alert to prevent race conditions

      alert('Compass Calibration Required',
        'Compass calibration is turned off or needs calibration for accurate orientation measurements. Please enable compass calibration in Settings > Privacy & Security > Location Services > System Services > Compass Calibration.');
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

  return (
    <View style={{flex: 1}}>
      <CompassFace
        compassData={compassData}
        compassMeasurementTypes={compassMeasurementTypes}
        grabMeasurements={grabMeasurements}
      />
      {showCompassRawDataView && <CompassDebug compassData={compassData} matrixRotation={matrixRawData?.current}/>}
    </View>
  );
};

export default Compass;
