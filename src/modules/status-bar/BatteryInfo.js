import React from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useBatteryLevel, usePowerState} from 'react-native-device-info';

import statusBarStyles from './statusBar.styles';
import {BATTERY_ICON_NAMES, ICON_TYPE} from './statusBarIcon.constants';

const BatteryInfo = () => {
  // usePowerState only re-emits on plug/unplug and Low Power Mode changes, so the level it
  // returns goes stale as the battery discharges. useBatteryLevel subscribes to the level-change
  // event, so it stays current while the app is open.
  const batteryLevel = useBatteryLevel();
  const {batteryState} = usePowerState();

  const batteryPercentage = (batteryLevel * 100).toFixed(0);

  const getBatteryStatusColor = () => {
    if (batteryLevel >= 0.65 || batteryState === 'charging') return 'green';
    else if (batteryLevel >= 0.35) return 'goldenrod';
    else return 'red';
  };

  const getBatteryImage = () => {
    if (batteryState === 'charging') {
      if (batteryLevel >= 0.95) return BATTERY_ICON_NAMES.CHARGING_STATE.FULL;
      else if (batteryLevel >= 0.85) return BATTERY_ICON_NAMES.CHARGING_STATE.NINTY;
      else if (batteryLevel >= 0.75) return BATTERY_ICON_NAMES.CHARGING_STATE.EIGHTY;
      else if (batteryLevel >= 0.65) return BATTERY_ICON_NAMES.CHARGING_STATE.SEVENTY;
      else if (batteryLevel >= 0.55) return BATTERY_ICON_NAMES.CHARGING_STATE.SIXTY;
      else if (batteryLevel >= 0.45) return BATTERY_ICON_NAMES.CHARGING_STATE.FIFTY;
      else if (batteryLevel >= 0.35) return BATTERY_ICON_NAMES.CHARGING_STATE.FORTY;
      else if (batteryLevel >= 0.25) return BATTERY_ICON_NAMES.CHARGING_STATE.THIRTY;
      else if (batteryLevel >= 0.15) return BATTERY_ICON_NAMES.CHARGING_STATE.TWENTY;
      else return BATTERY_ICON_NAMES.CHARGING_STATE.TEN;
    }
    else {
      if (batteryLevel >= 0.95) return BATTERY_ICON_NAMES.DISCHARGING_STATE.FULL;
      else if (batteryLevel >= 0.85) return BATTERY_ICON_NAMES.DISCHARGING_STATE.NINTY;
      else if (batteryLevel >= 0.75) return BATTERY_ICON_NAMES.DISCHARGING_STATE.EIGHTY;
      else if (batteryLevel >= 0.65) return BATTERY_ICON_NAMES.DISCHARGING_STATE.SEVENTY;
      else if (batteryLevel >= 0.55) return BATTERY_ICON_NAMES.DISCHARGING_STATE.SIXTY;
      else if (batteryLevel >= 0.45) return BATTERY_ICON_NAMES.DISCHARGING_STATE.FIFTY;
      else if (batteryLevel >= 0.35) return BATTERY_ICON_NAMES.DISCHARGING_STATE.FORTY;
      else if (batteryLevel >= 0.25) return BATTERY_ICON_NAMES.DISCHARGING_STATE.THIRTY;
      else if (batteryLevel >= 0.15) return BATTERY_ICON_NAMES.DISCHARGING_STATE.TWENTY;
      else return BATTERY_ICON_NAMES.DISCHARGING_STATE.TEN;
    }
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
