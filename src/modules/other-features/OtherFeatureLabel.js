import React from 'react';
import {Text} from 'react-native';

import {getTitle} from './otherFeatures.helpers';

const OtherFeatureLabel = ({item}) => {
  /* View */

  return (
    <Text>{getTitle(item)}</Text>
  );
};
export default OtherFeatureLabel;
