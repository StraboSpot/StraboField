import React from 'react';
import {Platform, Switch, useColorScheme, View} from 'react-native';

import {
  LIGHTGREY,
  MEDIUMGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_ACCENT_COLOR_FADED_20,
  PRIMARY_ACCENT_COLOR_FADED_40,
  PRIMARY_ACCENT_COLOR_FADED_60,
} from '../styles.constants';

const SwitchWrapper = ({disabled, onValueChange, value}) => {

  const systemScheme = useColorScheme();
  const isDarkMode = systemScheme === 'dark';

  // Every platform fades only the on state for disabled, leaving a disabled off switch identical to one
  // that can still be turned on. Fade the whole control so the two read differently.
  const switchStyle = disabled ? {opacity: 0.5} : undefined;

  if (Platform.OS === 'web') {
    return (
      // The web switch is a plain checkbox, and a press on it carries on up to whatever the switch sits in
      // and fires that too, opening a detail page from a row the switch is only a part of. Every other
      // pressable stops its own click, so stop this one to keep the press to the switch.
      <Switch
        activeThumbColor={disabled ? PRIMARY_ACCENT_COLOR_FADED_60 : PRIMARY_ACCENT_COLOR}
        activeTrackColor={disabled ? PRIMARY_ACCENT_COLOR_FADED_20 : PRIMARY_ACCENT_COLOR_FADED_40}
        disabled={disabled}
        onClick={evt => evt.stopPropagation()}
        onValueChange={onValueChange}
        style={switchStyle}
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
          ios_backgroundColor={isDarkMode ? MEDIUMGREY : LIGHTGREY}
          onValueChange={onValueChange}
          style={switchStyle}
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
        style={switchStyle}
        thumbColor={value ? disabled ? PRIMARY_ACCENT_COLOR_FADED_60 : PRIMARY_ACCENT_COLOR : LIGHTGREY}
        trackColor={{false: MEDIUMGREY, true: disabled ? PRIMARY_ACCENT_COLOR_FADED_20 : PRIMARY_ACCENT_COLOR_FADED_40}}
        value={value}
      />
    );
  }
};

export default SwitchWrapper;
