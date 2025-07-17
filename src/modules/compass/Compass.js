import React, {useEffect, useRef, useState} from 'react';
import {AppState, NativeEventEmitter, Platform, Switch, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {setCompassMeasurements} from './compass.slice';
import compassStyles from './compass.styles';
import CompassDebug from './CompassDebug';
import CompassFace from './CompassFace';
import useCompassSound from './useCompassSound';
import CompassModule from '../../services/CompassModule';
import useCompass from '../../services/useCompass';
import {isEmpty, roundToDecimalPlaces} from '../../shared/Helpers';
import {setModalVisible} from '../home/home.slice';
import useMeasurements from '../measurements/useMeasurements';
import {MODAL_KEYS} from '../page/page.constants';

const Compass = ({
                   closeCompass,
                   setAttributeMeasurements,
                   setMeasurements,
                   sliderValue,
                 }) => {
  let magneticDeclination = useRef(0);
  let matrixRawData = useRef(null);

  const CompassEvents = new NativeEventEmitter(CompassModule);
  const {startSensors, stopSensors, startCompass, stopCompass} = CompassModule;

  const dispatch = useDispatch();
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const modalVisible = useSelector(state => state.home.modalVisible);

  const {
    cartesianToSpherical,
    matrixAverage,
    getStrikeAndDip,
    getTrendAndPlunge,
    getUserDeclination,
  } = useCompass();
  const {playCompassSound} = useCompassSound();

  const [compassData, setCompassData] = useState({
    magHeading: 0,
    trueHeading: 0,
    strike: 0,
    magDecStrike: 0,
    dip_direction: null,
    dip: null,
    trend: 0,
    magDecTrend: 0,
    plunge: null,
    rake: null,
    rake_calculated: 'yes',
    quality: null,
  });
  // const [matrixRotation, setMatrixRotation] = useState({});
  const [showCompassRawDataView, setShowCompassRawDataView] = useState(false);
  // const [userDeclination, setUserDeclination] = useState('');
  const {createNewMeasurement} = useMeasurements();

  useEffect(() => {
    console.log('UE Compass []');
    getDeclination().catch(err => console.error('Error getting user\'s declination', err));
    subscribeToSensors();
    AppState.addEventListener('change', handleAppStateChange);
    return () => {
      unsubscribeFromSensors();
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

  const addAttributeMeasurement = (data) => {
    const sliderQuality = sliderValue ? {quality: sliderValue.toString()} : undefined;
    setAttributeMeasurements({...data, ...sliderQuality});
    closeCompass();
  };

  // const trueNorthButton = () => <Text>True North</Text>;
  // const magNorthButton = () => <Text>Mag North</Text>;
  // const groupButtons = [{element: trueNorthButton}, {element: magNorthButton}];

  const getDeclination = async () => {
    try {
      const declination = await getUserDeclination();
      console.log('Declination is:', declination);
      magneticDeclination.current = declination;
    }
    catch (err) {
      console.error('Magnetic Declination not available', err);
    }

  };

  const grabMeasurements = async (isCompassMeasurement) => {
    try {
      if (isCompassMeasurement) {
        if (playCompassSound) playCompassSound();
        const unixTimestamp = Date.now();
        const sliderQuality = !sliderValue || sliderValue === 6 ? {} : {quality: sliderValue.toString()};
        console.log('Compass measurements', compassData, sliderValue);
        if (setAttributeMeasurements) addAttributeMeasurement(compassData);
        else if (setMeasurements) {
          setMeasurements({...compassData, ...sliderQuality, unix_timestamp: unixTimestamp});
        }
        else {
          dispatch(setCompassMeasurements(compassData.quality ? compassData
            : {...compassData, ...sliderQuality}));
        }
      }
      else dispatch(setCompassMeasurements({...compassData, manual: true}));
    }
    catch (e) {
      console.log('Error grabbing compass measurement', e);
    }
  };

  const handleAppStateChange = (state) => {
    if (state === 'background' || state === 'inactive') {
      dispatch(setModalVisible({modal: null}));
      setShowCompassRawDataView(false);
      unsubscribeFromSensors();
    }
  };

  const getCartesianToSpherical = async (matrixRotationData) => {
    let ENU_Pole;
    let ENU_TP;
    let strike;
    let trend;
    let declination = magneticDeclination?.current;

    const matrix = Platform.OS === 'ios' ? matrixRotationData.matrix : matrixRotationData;
    matrixRawData.current = matrix;

    let {magneticHeading, trueHeading} = matrixRotationData;
    const {m21, m22, m23, m31, m32, m33} = matrix;
    if (Platform.OS === 'ios') {
      ENU_Pole = await cartesianToSpherical(-m32, m31, m33);
      ENU_TP = await cartesianToSpherical(-m22, m21, m23);
    }
    else {
      ENU_Pole = await cartesianToSpherical(m31, m32, m33);
      ENU_TP = await cartesianToSpherical(m21, m22, m23);
    }
    const strikeAndDip = await getStrikeAndDip(ENU_Pole);
    const trendAndPlunge = await getTrendAndPlunge(ENU_TP);

    if (Platform.OS === 'ios') {
      strike = strikeAndDip.strike;
      trend = trendAndPlunge.trend;
    }
    else {
      trueHeading = (magneticHeading + declination) % 360;
      strike = (strikeAndDip.strike + declination) % 360;
      trend = (trendAndPlunge.trend + declination) % 360;
    }

    const dipDirection = (strike + 90) % 360;
    setCompassData({
      declination: declination.toFixed(2),
      dip: roundToDecimalPlaces(strikeAndDip.dip, 0),
      dip_direction: roundToDecimalPlaces(dipDirection, 0),
      magHeading: roundToDecimalPlaces(magneticHeading, 0),
      plunge: roundToDecimalPlaces(trendAndPlunge.plunge, 0),
      strike: roundToDecimalPlaces(strike, 0),
      trend: roundToDecimalPlaces(trend, 0),
      trueHeading: roundToDecimalPlaces(trueHeading, 0),
    });
  };

  const handleMatrixRotationData = async (matrixData) => {
    try {
      // console.log(matrixData);
      if (Platform.OS === 'android') matrixData = await matrixAverage(matrixData);
      await getCartesianToSpherical(matrixData);
    }
    catch (err) {
      console.error('Error Getting Matrix', err);
    }
  };

  const subscribeToSensors = () => {
    try {
      CompassEvents.addListener('rotationMatrix', handleMatrixRotationData);
      Platform.OS === 'ios' ? startCompass() : startSensors();
      console.log('%cSUBSCRIBING to native compass data!', 'color: green');
    }
    catch (err) {
      console.error(('Error subscribing to the native data: ' + err));
    }
  };

  const toggleSwitch = () => {
    setShowCompassRawDataView(previousState => !previousState);
  }

  const unsubscribeFromSensors = () => {
    try {
      CompassEvents.addListener('rotationMatrix', handleMatrixRotationData).remove();
      Platform.OS === 'ios' ? stopCompass() : stopSensors();
      console.log('%cEnded Compass observation and rotationMatrix listener.', 'color: red');
    }
    catch (err) {
      console.error('Error unsubscribing to compass events', err);
    }
  };

  return (
    <View style={{flex: 1}}>
        <CompassFace
          compassMeasurementTypes={compassMeasurementTypes}
          grabMeasurements={grabMeasurements}
          compassData={compassData}
        />
      <View style={compassStyles.matrixDataButtonContainer}>
        <View style={compassStyles.matrixDataButtonContainer}>
          <Text style={compassStyles.switchText}>Display Raw Data</Text>
          <Switch
            onValueChange={toggleSwitch}
            value={showCompassRawDataView}
          />
        </View>


      </View>
      {showCompassRawDataView && <CompassDebug
        compassData={compassData}
        matrixRotation={matrixRawData?.current}
      />}
    </View>
  );
};

export default Compass;
