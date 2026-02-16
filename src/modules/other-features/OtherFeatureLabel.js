import React from 'react';
import {Text} from 'react-native';

const OtherFeatureLabel = ({item}) => {
  /* Logic Helpers */

  const getTitle = (feature) => {
    const firstClassTitle = feature.name || 'Unnamed Feature';
    const secondClassTitle = feature.type?.toUpperCase() || 'UNKNOWN';
    return firstClassTitle + ' - ' + secondClassTitle;
  };

  /* View */

  return (
    <Text>{getTitle(item)}</Text>
  );
};
export default OtherFeatureLabel;
