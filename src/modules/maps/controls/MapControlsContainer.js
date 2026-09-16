import React from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import controlStyles from './controls.styles';
import MapScaleBar from './MapScaleBar';
import MapZoomDisplay from './MapZoomDisplay';
import {SMALL_SCREEN} from '../../../shared/styles.constants';

const MapControlsContainer = () => {
  /* Data Hooks */

  const {currentImageBasemap, stratSection} = useSelector(state => state.map);

  /* View */

  // Neither reading means anything on an image basemap or a strat section, which have no ground scale.
  // Owned here rather than at the call sites, since small screens render this with the map action buttons
  // and everything else renders it over the map itself
  if (currentImageBasemap || stratSection) return null;

  return (
    <View style={SMALL_SCREEN ? controlStyles.scaleZoomContainerSmall : controlStyles.scaleZoomContainer}>
      <MapScaleBar/>
      <MapZoomDisplay/>
    </View>
  );
};

export default MapControlsContainer;
