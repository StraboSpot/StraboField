import React from 'react';
import {View} from 'react-native';

import {DARKGREY} from '../../../shared/styles.constants';

const TagColorIcon = ({color}) => {
  return (
    <View style={{
      backgroundColor: color,
      borderColor: DARKGREY,
      borderWidth: 0.5,
      borderRadius: 50,
      height: 20,
      width: 20,
    }}/>
  );
};

export default TagColorIcon;
