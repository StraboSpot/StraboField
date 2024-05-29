import React, {useEffect, useRef, useState} from 'react';
import {AppState, NativeEventEmitter, Platform, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';
import {setCompassMeasurements} from './compass.slice';
import compassStyles from './compass.styles';
import CompassFace from './CompassFace';
import CompassModule from '../../services/CompassModule';
import useCompassHook from '../../services/useCompass';
import {isEmpty, roundToDecimalPlaces} from '../../shared/Helpers';
import DeviceSound from '../../utils/sounds/sound';
import {setModalVisible} from '../home/home.slice';
import useMeasurementsHook from '../measurements/useMeasurements';
import {MODAL_KEYS} from '../page/page.constants';

const Compass = ({
                   closeCompass,
                   setAttributeMeasurements,
                   setMeasurements,
                   sliderValue,
                 }) => {
  let matrixArray = [];
  let magneticDeclination = useRef(0);

  const CompassEvents = new NativeEventEmitter(CompassModule);
  const {startSensors, stopSensors, getDeviceRotation, stopCompass} = CompassModule;

  const dispatch = useDispatch();
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const modalVisible = useSelector(state => state.home.modalVisible);

  const useCompass = useCompassHook();

  const [buttonSound, setButtonSound] = useState(null);
  const [compassData, setCompassData] = useState({
    magDecHeading: 0,
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
  const useMeasurements = useMeasurementsHook();

  useEffect(() => {
    console.log('UE Compass []');
    const buttonClick = new DeviceSound('compass_button_click.mp3', DeviceSound.MAIN_BUNDLE, (error) => {
      if (error) console.log('Failed to load sound', error);
    });
    setButtonSound(buttonClick);
  }, []);

  useEffect(() => {
    console.log('UE Compass []');
    getDeclination().catch(err => console.error('Error getting user\'s declination', err));
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
      useMeasurements.createNewMeasurement();
      dispatch(setCompassMeasurements({}));
    }
  }, [compassMeasurements]);

  const addAttributeMeasurement = (data) => {
    const sliderQuality = sliderValue ? {quality: sliderValue.toString()} : undefined;
    setAttributeMeasurements({...data, ...sliderQuality});
    closeCompass();
  };

  const trueNorthButton = () => <Text>True North</Text>;
  const magNorthButton = () => <Text>Mag North</Text>;
  const groupButtons = [{element: trueNorthButton}, {element: magNorthButton}];

  const getDeclination = async () => {
    const declination = await useCompass.getUserDeclination();
    console.log('Declination is:', declination);
    magneticDeclination.current = declination;
    subscribeToSensors();
  };

  const grabMeasurements = async (isCompassMeasurement) => {
    try {
      if (isCompassMeasurement) {
        if (buttonSound) {
          buttonSound.play((success) => {
            if (success) console.log('successfully finished playing compass sound');
            else console.log('compass sound failed due to audio decoding errors');
          });
        }
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
    const heading = matrixRotationData.heading;
    const adjustedHeadingWithMagDecl = heading > 0 ? heading + magneticDeclination.current : heading - magneticDeclination.current;
    if (Platform.OS === 'ios') {
      ENU_Pole = await useCompass.cartesianToSpherical(-matrixRotationData.M32, matrixRotationData.M31,
        matrixRotationData.M33);
      ENU_TP = await useCompass.cartesianToSpherical(-matrixRotationData.M22, matrixRotationData.M21,
        matrixRotationData.M23);
    }
    else {
      ENU_Pole = await useCompass.cartesianToSpherical(matrixRotationData.M31, matrixRotationData.M32,
        matrixRotationData.M33);
      ENU_TP = await useCompass.cartesianToSpherical(matrixRotationData.M21, matrixRotationData.M22,
        matrixRotationData.M23);
    }
    const strikeAndDip = await useCompass.strikeAndDip(ENU_Pole);
    const trendAndPlunge = await useCompass.trendAndPlunge(ENU_TP);
    const adjustedStrike = heading < 0 ? strikeAndDip.strike + magneticDeclination.current : strikeAndDip.strike - magneticDeclination.current;
    const adjustedTrend = heading < 0 ? trendAndPlunge.trend + magneticDeclination.current : trendAndPlunge.trend - magneticDeclination.current;
    // const declinationRadians = magneticDeclination * Math.PI / 180;
    // const adjustedHeading = heading + declinationRadians;
    setCompassData({
      magDecHeading: roundToDecimalPlaces(heading, 0),
      trueHeading: roundToDecimalPlaces(adjustedHeadingWithMagDecl, 0),
      strike: roundToDecimalPlaces(strikeAndDip.strike, 0),
      magDecStrike: roundToDecimalPlaces(adjustedStrike, 0),
      dip: roundToDecimalPlaces(strikeAndDip.dip, 0),
      trend: roundToDecimalPlaces(trendAndPlunge.trend, 0),
      magDecTrend: roundToDecimalPlaces(adjustedTrend, 0),
      plunge: roundToDecimalPlaces(trendAndPlunge.plunge, 0),
    });
  };

  const handleMatrixRotationData = async (res) => {
    try {
      let matrixData = res;
      if (Platform.OS === 'android') matrixData = await matrixAverage(matrixData);
      await getCartesianToSpherical(matrixData);
    }
    catch (err) {
      console.error('Error Getting Matrix', err);
    }
  };

  const matrixAverage = async (res) => {
    // console.log('Matrix Average', res);
    matrixArray.push(res);

    if (matrixArray.length > 5) {
      matrixArray.shift();
      // console.log('Matrix Array', matrixArray);
    }
    const m11Avg = matrixArray.reduce((sum, obj) => sum + obj.M11 / matrixArray.length, 0);
    const m12Avg = matrixArray.reduce((sum, obj) => sum + obj.M12 / matrixArray.length, 0);
    const m13Avg = matrixArray.reduce((sum, obj) => sum + obj.M13 / matrixArray.length, 0);
    const m21Avg = matrixArray.reduce((sum, obj) => sum + obj.M21 / matrixArray.length, 0);
    const m22Avg = matrixArray.reduce((sum, obj) => sum + obj.M22 / matrixArray.length, 0);
    const m23Avg = matrixArray.reduce((sum, obj) => sum + obj.M23 / matrixArray.length, 0);
    const m31Avg = matrixArray.reduce((sum, obj) => sum + obj.M31 / matrixArray.length, 0);
    const m32Avg = matrixArray.reduce((sum, obj) => sum + obj.M32 / matrixArray.length, 0);
    const m33Avg = matrixArray.reduce((sum, obj) => sum + obj.M33 / matrixArray.length, 0);
    const headingAvg = matrixArray.reduce((sum, obj) => sum + obj.heading / matrixArray.length, 0);

    const newMatrixObject = {
      M11: roundToDecimalPlaces(m11Avg, 3),
      M12: roundToDecimalPlaces(m12Avg, 3),
      M13: roundToDecimalPlaces(m13Avg, 3),
      M21: roundToDecimalPlaces(m21Avg, 3),
      M22: roundToDecimalPlaces(m22Avg, 3),
      M23: roundToDecimalPlaces(m23Avg, 3),
      M31: roundToDecimalPlaces(m31Avg, 3),
      M32: roundToDecimalPlaces(m32Avg, 3),
      M33: roundToDecimalPlaces(m33Avg, 3),
      heading: roundToDecimalPlaces(headingAvg, 0),
    };
    return newMatrixObject;
  };

  // const Row = ({children}) => (
  //   <View style={compassStyles.compassDataGridRow}>{children}</View>
  // );
  // const Col = ({numRows, children}) => {
  //   return (
  //     <View style={compassStyles[`compassDataCol${numRows}`]}>{children}</View>
  //   );
  // };

  // const renderColumnLabels = () => {
  //   if (Platform.OS === 'ios') {
  //     return (
  //       <>
  //         <Text>North</Text>
  //         <Text>West</Text>
  //         <Text>Up</Text>
  //       </>
  //     );
  //   }
  //   else {
  //     return (
  //       <>
  //         <Text>East</Text>
  //         <Text>North</Text>
  //         <Text>Up</Text>
  //       </>
  //     );
  //   }
  // };

  // const renderCompassData = () => (
  //   <View>
  //     <View style={compassStyles.compassDataGridContainer}>
  //       <Text style={overlayStyles.titleText}>Matrix Rotation</Text>
  //       <Text style={overlayStyles.titleText}>Heading: {compassData.heading}</Text>
  //       <View style={compassStyles.compassDataDirectionTextContainer}>
  //         {renderColumnLabels()}
  //       </View>
  //       <Row>
  //         <Col numRows={1}>
  //           <Text style={compassStyles.compassDataText}>X</Text>
  //         </Col>
  //         <Col numRows={3}>
  //           <Text style={compassStyles.compassDataText}>M11: {'\n'}{roundToDecimalPlaces(matrixRotation.M11, 3)}</Text>
  //         </Col>
  //         <Col numRows={3}>
  //           <Text style={compassStyles.compassDataText}>M12: {'\n'}{roundToDecimalPlaces(matrixRotation.M12, 3)}</Text>
  //         </Col>
  //         <Col numRows={3}>
  //           <Text style={compassStyles.compassDataText}>M13: {'\n'}{roundToDecimalPlaces(matrixRotation.M13, 3)}</Text>
  //         </Col>
  //       </Row>
  //       <Row>
  //         <Col numRows={1}>
  //           <Text style={compassStyles.compassDataText}>Y</Text>
  //         </Col>
  //         <Col numRows={3}>
  //           <Text style={compassStyles.compassDataText}>M21: {'\n'}{roundToDecimalPlaces(matrixRotation.M21, 3)}</Text>
  //         </Col>
  //         <Col numRows={3}>
  //           <Text style={compassStyles.compassDataText}>M22: {'\n'}{roundToDecimalPlaces(matrixRotation.M22, 3)}</Text>
  //         </Col>
  //         <Col numRows={3}>
  //           <Text style={compassStyles.compassDataText}>M23: {'\n'}{roundToDecimalPlaces(matrixRotation.M23, 3)}</Text>
  //         </Col>
  //       </Row>
  //       <Row>
  //         <Col numRows={1}>
  //           <Text style={compassStyles.compassDataText}>Z</Text>
  //         </Col>
  //         <Col numRows={3}>
  //           <Text style={compassStyles.compassDataText}>M31: {'\n'}{roundToDecimalPlaces(matrixRotation.M31, 3)}</Text>
  //         </Col>
  //         <Col numRows={3}>
  //           <Text style={compassStyles.compassDataText}>M32: {'\n'}{roundToDecimalPlaces(matrixRotation.M32, 3)}</Text>
  //         </Col>
  //         <Col numRows={3}>
  //           <Text style={compassStyles.compassDataText}>M33: {'\n'}{roundToDecimalPlaces(matrixRotation.M33, 3)}</Text>
  //         </Col>
  //       </Row>
  //     </View>
  //   </View>
  // );

  const planerType = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR);
  const linearType = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR);

  const renderCompassMeasurementsText = () => {
    if (planerType && linearType) {
      return (
        <View style={compassStyles.rawMeasurementsTextContainer}>
          <View>
            <Text style={compassStyles.compassDataText}>Strike: {compassData.strike || 0}</Text>
            <Text style={compassStyles.compassDataText}>Trend: {compassData.trend || 0}</Text>
          </View>
          <View>
            <Text style={compassStyles.compassDataText}>Dip: {compassData.dip || 0}</Text>
            <Text style={compassStyles.compassDataText}>Plunge: {compassData.plunge || 0}</Text>
          </View>
        </View>
      );
    }
    else if (planerType) {
      return (
        <View style={compassStyles.rawMeasurementsTextContainer}>
          <Text style={compassStyles.compassDataText}>Strike: {compassData.strike || 0}</Text>
          <Text style={compassStyles.compassDataText}>Dip: {compassData.dip || 0}</Text>
        </View>
      );
    }
    else if (linearType) {
      return (
        <View style={compassStyles.rawMeasurementsTextContainer}>
          <Text style={compassStyles.compassDataText}>Trend: {compassData.trend || 0}</Text>
          <Text style={compassStyles.compassDataText}>Plunge: {compassData.plunge || 0}</Text>
        </View>
      );
    }
  };

  const subscribeToSensors = () => {
    try {
      CompassEvents.addListener('rotationMatrix', handleMatrixRotationData);

      Platform.OS === 'ios' ? getDeviceRotation() : startSensors();
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
        <Text style={{textAlign: 'center', fontWeight: 'bold'}}>MDeclination: {magneticDeclination.current?.toFixed(
          2)}</Text>
        {/*<Text style={{textAlign: 'center', fontWeight: 'bold'}}>True Heading: {compassData.trueHeading}</Text>*/}
        {/*<Text style={{textAlign: 'center', fontWeight: 'bold'}}>Mag Heading: {compassData.magHeading}</Text>*/}
        <CompassFace
          compassMeasurementTypes={compassMeasurementTypes}
          grabMeasurements={grabMeasurements}
          compassData={compassData}
        />
        {/*{renderCompassMeasurementsText()}*/}
      </View>
      {/*<View style={compassStyles.matrixDataButtonContainer}>*/}
      {/*<Button*/}
      {/*  containerStyle={compassStyles.matrixDataButtonContainer}*/}
      {/*  titleStyle={{fontSize: 10}}*/}
      {/*  title={showCompassRawDataView ? 'Hide Raw Data' : 'Display Raw Data'}*/}
      {/*  type={'clear'}*/}
      {/*  onPress={() => setShowCompassRawDataView(!showCompassRawDataView)}*/}
      {/*/>*/}
      {/*</View>*/}
    </View>
  );
};

export default Compass;
