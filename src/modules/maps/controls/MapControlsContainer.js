import React from 'react';
import {View} from 'react-native';

import controlStyles from './controls.styles';
import MapScaleBar from './MapScaleBar';
import MapZoomDisplay from './MapZoomDisplay';
import {SMALL_SCREEN} from '../../../shared/styles.constants';

const MapControlsContainer = ({zoom}) => {
  return (
    <View style={SMALL_SCREEN ? controlStyles.scaleZoomContainerSmall : controlStyles.scaleZoomContainer}>
      <MapScaleBar zoom={zoom}/>
      <MapZoomDisplay/>
    </View>
  );
};

export default MapControlsContainer;
