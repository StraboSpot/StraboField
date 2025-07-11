import React, {useEffect, useRef, useState} from 'react';
import {AppState, NativeEventEmitter, Platform, Text, View} from 'react-native';

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
  let matrixArray = [];
  let magneticDeclination = useRef(0);
  let matrixRawData = useRef(null);

  const CompassEvents = new NativeEventEmitter(CompassModule);
  const {startSensors, stopSensors, startCompass, stopCompass} = CompassModule;

  const dispatch = useDispatch();
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const modalVisible = useSelector(state => state.home.modalVisible);

  const {cartesianToSpherical, getStrikeAndDip, getTrendAndPlunge, getUserDeclination} = useCompass();
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
    matrixRawData.current = matrixRotationData;
    const {magneticHeading, trueHeading, declination} = matrixRotationData;
    const matrix = Platform.OS === 'ios' ? matrixRotationData.matrix : matrixRotationData;
    const {m21, m22, m23, m31, m32, m33} = matrix;
    // const {heading, trueHeading, declination} = matrixRotationData
    // const heading = matrixRotationData.heading;
    // const adjustedHeadingWithMagDecl = trueHeading > 0 ? trueHeading + magneticDeclination.current : trueHeading - magneticDeclination.current;
    // const trueHeadingFromPlatform= Platform.OS === 'ios' ? trueHeading : magneticHeading;
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
    const adjustedStrikeRaw = magneticHeading < 0 ? strikeAndDip.strike + magneticDeclination.current : strikeAndDip.strike - magneticDeclination.current;
    const adjustedTrendRaw = magneticHeading < 0 ? trendAndPlunge.trend + magneticDeclination.current : trendAndPlunge.trend - magneticDeclination.current;

    const adjustedStrike = normalizeAngle(adjustedStrikeRaw);
    const adjustedTrend = normalizeAngle(adjustedTrendRaw);
    if (Platform.OS === 'ios') {
      strike = strikeAndDip.strike;
      trend = trendAndPlunge.trend;
    }
    else {
      strike = adjustedStrike;
      trend = adjustedTrend;
    }

    let dipDirection = strikeAndDip.strike + 90;
    if (dipDirection >= 360) dipDirection = dipDirection - 360;
    setCompassData({
      declination: declination,
      dip: roundToDecimalPlaces(strikeAndDip.dip, 0),
      dip_direction: roundToDecimalPlaces(dipDirection, 0),
      magDecStrike: roundToDecimalPlaces(adjustedStrike, 0),
      magDecTrend: roundToDecimalPlaces(adjustedTrend, 0),
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

  const normalizeAngle = (angle) => {
    return (angle % 360 + 360) % 360;
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
      trueHeading: roundToDecimalPlaces(matrixData.trueHeading, 0),
      magneticHeading: roundToDecimalPlaces(matrixData.magneticHeading, 0),
      declination: roundToDecimalPlaces(matrixData.declination, 0),
    };
    return newMatrixObject;
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
      <View style={{flex: 1}}>
        {/*<Text style={{textAlign: 'center', fontWeight: 'bold'}}>MDeclination: {magneticDeclination.current?.toFixed(2)}</Text>*/}
        {/*<Text style={{textAlign: 'center', fontWeight: 'bold'}}>MDeclination Degree: {compassData.declination}</Text>*/}
        {/*<Text style={{textAlign: 'center', fontWeight: 'bold'}}>True Heading: {compassData.trueHeading}</Text>*/}
        {/*<Text style={{textAlign: 'center', fontWeight: 'bold'}}>Mag Heading: {compassData.magHeading}</Text>*/}
        {/*<Text style={{textAlign: 'center', fontWeight: 'bold'}}>Strike: {compassData.strike}</Text>*/}
        {/*<Text style={{textAlign: 'center', fontWeight: 'bold'}}>MStrike: {compassData.magDecStrike}</Text>*/}
        <CompassFace
          compassMeasurementTypes={compassMeasurementTypes}
          grabMeasurements={grabMeasurements}
          compassData={compassData}
        />
      </View>
      {showCompassRawDataView && <CompassDebug
        compassData={compassData}
        matrixRotation={matrixRawData?.current}
      />}
      <View style={compassStyles.matrixDataButtonContainer}>
        {__DEV__ && <Button
          containerStyle={compassStyles.matrixDataButtonContainer}
          titleStyle={{fontSize: 10}}
          title={showCompassRawDataView ? 'Hide Raw Data' : 'Display Raw Data'}
          type={'clear'}
          onPress={() => setShowCompassRawDataView(!showCompassRawDataView)}
        />}
      </View>
    </View>
  );
};

export default Compass;
