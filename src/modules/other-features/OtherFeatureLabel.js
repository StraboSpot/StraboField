import React from 'react';
import {Text} from 'react-native';

const OtherFeatureLabel = ({item}) => {

  const getTitle = (feature) => {
    const firstClassTitle = feature.name || 'Unnamed Feature';
    const secondClassTitle = feature.type?.toUpperCase() || 'UNKNOWN';
    return firstClassTitle + ' - ' + secondClassTitle;
  };

  return (
    <Text>{getTitle(item)}</Text>
  );
};
export default OtherFeatureLabel;
