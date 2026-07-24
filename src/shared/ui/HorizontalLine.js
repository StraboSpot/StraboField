import React from 'react';
import {View} from 'react-native';

import styles from './ui.styles';

const HorizontalLine = ({style}) => {
  return (
    <View style={[styles.horizontalLine, style]}/>
  );
};

export default HorizontalLine;
