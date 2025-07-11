import React, {useEffect} from 'react';
import {Platform, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';
import compassStyles from './compass.styles';
import {roundToDecimalPlaces} from '../../shared/Helpers';
import {overlayStyles} from '../home/overlays';

const CompassDebug = ({compassData, matrixRotation}) => {
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);

  useEffect(() => {
    console.log('Compass Debug MOUNTED');
    return () => {
      console.log('Compass Debug UNMOUNTED');
    }
  }, [])

  const planerType = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR);
  const linearType = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR);

  const Row = ({children}) => (
    <View style={compassStyles.compassDataGridRow}>{children}</View>
  );
  const Col = ({numRows, children}) => {
    return (
      <View style={compassStyles[`compassDataCol${numRows}`]}>{children}</View>
    );
  };

  const renderColumnLabels = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          <Text>North</Text>
          <Text>West</Text>
          <Text>Up</Text>
        </>
      );
    }
    else {
      return (
        <>
          <Text>East</Text>
          <Text>North</Text>
          <Text>Up</Text>
        </>
      );
    }
  };

  const renderCompassMeasurementsText = () => {
    if (planerType && linearType) {
      return (
        <View style={compassStyles.rawMeasurementsTextContainer}>
          <View>
            <Text style={compassStyles.compassDataText}>Strike: {compassData.strike || 0}</Text>
            {/*<Text style={compassStyles.compassDataText}>Strike: {compassData.magDecStrike || 0}</Text>*/}
            <Text style={compassStyles.compassDataText}>Trend: {compassData.trend || 0}</Text>
            {/*<Text style={compassStyles.compassDataText}>Trend: {compassData.magDecTrend || 0}</Text>*/}
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
          {/*<Text style={compassStyles.compassDataText}>Strike w/ Dec: {compassData.magDecStrike || 0}</Text>*/}
          <Text style={compassStyles.compassDataText}>Dip: {compassData.dip || 0}</Text>
        </View>
      );
    }
    else if (linearType) {
      return (
        <View style={compassStyles.rawMeasurementsTextContainer}>
          <Text style={compassStyles.compassDataText}>Trend: {compassData.trend || 0}</Text>
          {/*<Text style={compassStyles.compassDataText}>Trend: {compassData.magDecTrend || 0}</Text>*/}
          <Text style={compassStyles.compassDataText}>Plunge: {compassData.plunge || 0}</Text>
        </View>
      );
    }
  };

  const renderCompassData = () => (
    <View>
      <View style={compassStyles.compassDataGridContainer}>
        <Text style={overlayStyles.titleText}>Matrix Rotation</Text>
        <Text style={overlayStyles.titleText}>True Heading: {compassData.trueHeading}</Text>
        <Text style={overlayStyles.titleText}>Magnetic Heading: {compassData.magHeading}</Text>
        <Text style={overlayStyles.titleText}>Declination: {compassData.declination}</Text>
        <View style={compassStyles.compassDataDirectionTextContainer}>
          {renderColumnLabels()}
        </View>
        <Row>
          <Col numRows={1}>
            <Text style={compassStyles.compassDataText}>X</Text>
          </Col>
          <Col numRows={3}>
            <Text style={compassStyles.compassDataText}>M11: {'\n'}{roundToDecimalPlaces(matrixRotation?.m11, 3)}</Text>
          </Col>
          <Col numRows={3}>
            <Text style={compassStyles.compassDataText}>M12: {'\n'}{roundToDecimalPlaces(matrixRotation?.m12, 3)}</Text>
          </Col>
          <Col numRows={3}>
            <Text style={compassStyles.compassDataText}>M13: {'\n'}{roundToDecimalPlaces(matrixRotation?.m13, 3)}</Text>
          </Col>
        </Row>
        <Row>
          <Col numRows={1}>
            <Text style={compassStyles.compassDataText}>Y</Text>
          </Col>
          <Col numRows={3}>
            <Text style={compassStyles.compassDataText}>M21: {'\n'}{roundToDecimalPlaces(matrixRotation?.m21, 3)}</Text>
          </Col>
          <Col numRows={3}>
            <Text style={compassStyles.compassDataText}>M22: {'\n'}{roundToDecimalPlaces(matrixRotation?.m22, 3)}</Text>
          </Col>
          <Col numRows={3}>
            <Text style={compassStyles.compassDataText}>M23: {'\n'}{roundToDecimalPlaces(matrixRotation?.m23, 3)}</Text>
          </Col>
        </Row>
        <Row>
          <Col numRows={1}>
            <Text style={compassStyles.compassDataText}>Z</Text>
          </Col>
          <Col numRows={3}>
            <Text style={compassStyles.compassDataText}>M31: {'\n'}{roundToDecimalPlaces(matrixRotation?.m31, 3)}</Text>
          </Col>
          <Col numRows={3}>
            <Text style={compassStyles.compassDataText}>M32: {'\n'}{roundToDecimalPlaces(matrixRotation?.m32, 3)}</Text>
          </Col>
          <Col numRows={3}>
            <Text style={compassStyles.compassDataText}>M33: {'\n'}{roundToDecimalPlaces(matrixRotation?.m33, 3)}</Text>
          </Col>
        </Row>
      </View>
    </View>
  );
  return (
    <React.Fragment>
      {renderCompassData()}
      {renderCompassMeasurementsText()}
    </React.Fragment>
  );
};

export default CompassDebug;
