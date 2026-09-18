import React from 'react';
import {Text} from 'react-native';

import {getEnteredLabel, getTitle} from './otherFeatures.helpers';

const OtherFeatureLabel = ({item}) => {
  /* View */

  return (
    <Text>{getEnteredLabel(item) || getTitle(item)}</Text>
  );
};
export default OtherFeatureLabel;
