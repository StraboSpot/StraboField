import React from 'react';
import {Platform, Switch} from 'react-native';

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
