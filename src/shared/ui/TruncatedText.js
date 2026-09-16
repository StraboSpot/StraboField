import React from 'react';
import {Text} from 'react-native';

import {PRIMARY_TEXT_COLOR, PRIMARY_TEXT_SIZE} from '../styles.constants';

const TruncatedText = ({style, title}) => (
  <Text
    ellipsizeMode={'tail'}
    numberOfLines={1}
    style={{textAlign: 'center', color: PRIMARY_TEXT_COLOR, fontSize: PRIMARY_TEXT_SIZE, ...style}}
  >
    {title}
  </Text>
);

export default TruncatedText;
