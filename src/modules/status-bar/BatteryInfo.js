import React from 'react';
import {Image, Text, View} from 'react-native';

import {useBatteryLevel} from 'react-native-device-info';

import uiStyles from '../../shared/ui/ui.styles';

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
      <View style={uiStyles.batteryStatusContainer}>
        <Image
          source={getBatterySource()}
          style={uiStyles.statusBarIcon}
        />
        <View style={uiStyles.batteryLevelTextContainer}>
          <Text style={uiStyles.batteryLevelText}>{batteryPercentage}%</Text>
        </View>
      </View>
    );
  }
};

export default BatteryInfo;
