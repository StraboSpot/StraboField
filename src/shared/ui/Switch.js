import React from 'react';
import {Platform, Switch} from 'react-native';

import {LIGHTGREY, MEDIUMGREY, PRIMARY_ACCENT_COLOR, PRIMARY_ACCENT_COLOR_FADED} from '../styles.constants';

const SwitchWrapper = ({onValueChange, value}) => {
  if (Platform.OS === 'web') {
    return (
      <Switch
        onValueChange={onValueChange}
        value={value}
        activeThumbColor={PRIMARY_ACCENT_COLOR}
        activeTrackColor={PRIMARY_ACCENT_COLOR_FADED}
        thumbColor={LIGHTGREY}
        trackColor={MEDIUMGREY}
      />
    );
  }
  else {
    return (
      <Switch
        onValueChange={onValueChange}
        value={value}
        thumbColor={value ? PRIMARY_ACCENT_COLOR : LIGHTGREY}
        trackColor={{false: MEDIUMGREY, true: PRIMARY_ACCENT_COLOR_FADED}}
      />
    );
  }
};

export default SwitchWrapper;
