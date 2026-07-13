import React from 'react';
import {Platform, Switch, View} from 'react-native';

import {
  LIGHTGREY,
  MEDIUMGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_ACCENT_COLOR_FADED_20,
  PRIMARY_ACCENT_COLOR_FADED_40,
  PRIMARY_ACCENT_COLOR_FADED_60,
} from '../styles.constants';

const SwitchWrapper = ({disabled, onValueChange, value}) => {
  if (Platform.OS === 'web') {
    return (
      <Switch
        activeThumbColor={disabled ? PRIMARY_ACCENT_COLOR_FADED_60 : PRIMARY_ACCENT_COLOR}
        activeTrackColor={disabled ? PRIMARY_ACCENT_COLOR_FADED_20 : PRIMARY_ACCENT_COLOR_FADED_40}
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor={LIGHTGREY}
        trackColor={MEDIUMGREY}
        value={value}
      />
    );
  }
  else if (Platform.OS === 'ios') {
    return (
      <View style={{transform: [{scaleX: 0.7}, {scaleY: 0.8}], marginRight: 5}}>
        <Switch
          disabled={disabled}
          ios_backgroundColor={LIGHTGREY}
          onValueChange={onValueChange}
          trackColor={{true: disabled ? PRIMARY_ACCENT_COLOR_FADED_60 : PRIMARY_ACCENT_COLOR}}
          value={value}
        />
      </View>
    );
  }
  else {
    return (
      <Switch
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor={value ? disabled ? PRIMARY_ACCENT_COLOR_FADED_60 : PRIMARY_ACCENT_COLOR : LIGHTGREY}
        trackColor={{false: MEDIUMGREY, true: disabled ? PRIMARY_ACCENT_COLOR_FADED_20 : PRIMARY_ACCENT_COLOR_FADED_40}}
        value={value}
      />
    );
  }
};

export default SwitchWrapper;
