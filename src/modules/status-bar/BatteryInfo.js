import React from 'react';
import {Image, Text, View} from 'react-native';

import {useBatteryLevel} from 'react-native-device-info';

import statusBarStyles from './statusBar.styles';

const batteryGreen = require('../../assets/icons/BatteryGreenButton.png');
const batteryRed = require('../../assets/icons/BatteryRedButton.png');
const batteryYellow = require('../../assets/icons/BatteryYellowButton.png');

const BatteryInfo = () => {
  const batteryLevel = useBatteryLevel();

  const batteryPercentage = (batteryLevel * 100).toFixed(0);

  const getBatterySource = () => {
    if (batteryLevel >= 0.31) return batteryGreen;
    else if (batteryLevel > 0.21 && batteryLevel <= 0.30) return batteryYellow;
    else return batteryRed;
  };

  if (batteryPercentage !== '0') {
    return (
      <View style={statusBarStyles.batteryStatusContainer}>
        <Image
          source={getBatterySource()}
          style={statusBarStyles.statusBarIcon}
        />
        <View style={statusBarStyles.batteryLevelTextContainer}>
          <Text style={statusBarStyles.batteryLevelText}>{batteryPercentage}%</Text>
        </View>
      </View>
    );
  }
};

export default BatteryInfo;
