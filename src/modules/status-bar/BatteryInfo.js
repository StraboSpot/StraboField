import React from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useBatteryLevel, usePowerState} from 'react-native-device-info';

import statusBarStyles from './statusBar.styles';
import {BATTERY_ICON_NAMES, ICON_TYPE} from './statusBarIcon.constants';

const BatteryInfo = () => {
  const batteryLevel = useBatteryLevel();
  const {batteryState} = usePowerState();
  console.log('powerState', batteryState);

  const batteryPercentage = (batteryLevel * 100).toFixed(0);

  const getBatteryStatusColor = () => {
    if (batteryLevel >= 0.65) return 'green';
    else if (batteryLevel >= 0.35) return 'goldenrod';
    else return 'red';
  };

  const getBatteryImage = () => {
    if (batteryState === 'charging') return BATTERY_ICON_NAMES.CHARGING;
    if (batteryLevel >= 0.95) return BATTERY_ICON_NAMES.FULL;
    else if (batteryLevel >= 0.85) return BATTERY_ICON_NAMES.NINTY;
    else if (batteryLevel >= 0.75) return BATTERY_ICON_NAMES.EIGHTY;
    else if (batteryLevel >= 0.65) return BATTERY_ICON_NAMES.SEVENTY;
    else if (batteryLevel >= 0.55) return BATTERY_ICON_NAMES.SIXTY;
    else if (batteryLevel >= 0.45) return BATTERY_ICON_NAMES.FIFTY;
    else if (batteryLevel >= 0.35) return BATTERY_ICON_NAMES.FORTY;
    else if (batteryLevel >= 0.25) return BATTERY_ICON_NAMES.THIRTY;
    else if (batteryLevel >= 0.15) return BATTERY_ICON_NAMES.TWENTY;
    else return BATTERY_ICON_NAMES.TEN;
  };

  if (batteryPercentage !== '0') {
    return (
      <View style={statusBarStyles.batteryStatusContainer}>
        <Icon
          color={getBatteryStatusColor()}
          containerStyle={{transform: [{rotate: '270deg'}]}}
          name={getBatteryImage()}
          size={24}
          type={ICON_TYPE}
        />
        <View style={statusBarStyles.batteryLevelTextContainer}>
          <Text style={statusBarStyles.batteryLevelText}>{batteryPercentage}%</Text>
        </View>
      </View>
    );
  }
};

export default BatteryInfo;
