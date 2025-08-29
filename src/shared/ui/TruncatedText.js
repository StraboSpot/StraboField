import React from 'react';
import {Text} from 'react-native';

import {PRIMARY_TEXT_COLOR, PRIMARY_TEXT_SIZE} from '../styles.constants';

const TruncatedText = ({title}) => (
  <Text
    numberOfLines={1}
    ellipsizeMode={'tail'}
    style={{textAlign: 'center', color: PRIMARY_TEXT_COLOR, fontSize: PRIMARY_TEXT_SIZE}}
  >
    {title}
  </Text>
);

export default TruncatedText;
