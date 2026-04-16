import React, {useEffect} from 'react';
import {Platform, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';
import {formatDeg} from './compass.helpers';
import compassStyles from './compass.styles';
import {roundToDecimalPlaces} from '../../shared/Helpers';
import {overlayStyles} from '../home/overlays';

const CompassDebug = ({compassData, matrixRotation}) => {
  /* Data Hooks */

  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);

  /* Side Effects */

  useEffect(() => {
    console.log('Compass Debug MOUNTED');
    return () => console.log('Compass Debug UNMOUNTED');
  }, []);

  /* Render Functions */

  const renderCompassData = () => (
    <View style={compassStyles.compassDataGridContainer}>
      <Text style={overlayStyles.titleText}>
        📍 <Text style={{fontWeight: '600'}}>True Heading:</Text> {formatDeg(compassData?.trueHeading)}
      </Text>
      <Text style={overlayStyles.titleText}>
        🧭 <Text style={{fontWeight: '600'}}>Magnetic Heading:</Text> {formatDeg(compassData?.magHeading)}
      </Text>
      <Text style={overlayStyles.titleText}>
        🧲 <Text style={{fontWeight: '600'}}>Declination:</Text> {formatDeg(compassData?.declination)}
      </Text>

      <View style={{marginTop: 12, marginBottom: 6}}>
        <Text style={[overlayStyles.titleText, {fontSize: 16, textAlign: 'center'}]}>
          Rotation Matrix ({Platform.OS === 'ios' ? 'NWU' : 'ENU'})
        </Text>
      </View>

      {/* Matrix Grid */}
      {['m11', 'm12', 'm13', 'm21', 'm22', 'm23', 'm31', 'm32', 'm33'].reduce(
        (rows, key, idx) => {
          if (idx % 3 === 0) rows.push([]);
          rows[rows.length - 1].push(
            renderTableCol(key, (
              <Text>{key.toUpperCase()}:{'\n'}{roundToDecimalPlaces(matrixRotation?.[key], 3)}</Text>
            )),
          );
          return rows;
        }, [],
      ).map((cols, i) => renderTableRow(`row-${i}`, cols))}
    </View>
  );

  const renderCompassMeasurementsText = () => {
    const strike = formatDeg(compassData?.strike);
    const dip = formatDeg(compassData?.dip);
    const dipDirection = formatDeg(compassData?.dip_direction);
    const trend = formatDeg(compassData?.trend);
    const plunge = formatDeg(compassData?.plunge);

    const hasPlanar = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR);
    const hasLinear = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR);

    return (
      <View style={compassStyles.rawMeasurementsTextContainer}>
        {hasPlanar && (
          <View>
            <Text>Strike: {strike}</Text>
            <Text>Dip: {dip}</Text>
            <Text>Dip Direction: {dipDirection}</Text>
          </View>
        )}
        {hasLinear && (
          <View>
            <Text>Trend: {trend}</Text>
            <Text>Plunge: {plunge}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTableCol = (key, children) => (
    <View key={key} style={{flex: 1, alignItems: 'center', padding: 0}}>{children}</View>
  );

  const renderTableRow = (key, children) => (
    <View key={key} style={[compassStyles.compassDataGridRow, {marginVertical: 2, marginHorizontal: 'auto'}]}>
      {children}
    </View>
  );

  /* View */

  return (
    <>
      {renderCompassData()}
      {renderCompassMeasurementsText()}
    </>
  );
};

export default CompassDebug;
