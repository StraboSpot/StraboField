import React from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import controlStyles from './controls.styles';

const MapZoomDisplay = () => {
  const zoom = useSelector(state => state.map.zoom);

  if (zoom == null) return null;

  return (
    <View style={controlStyles.zoomContainer}>
      <Text style={controlStyles.zoomLabel}>Zoom: {zoom.toFixed(1)}</Text>
    </View>
  );
};

export default MapZoomDisplay;
