import React from 'react';
import {View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {MarkerView} from '@rnmapbox/maps';
import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/Helpers';

const MacrostratMarkerLayer = ({location}) => {
  /* Data Hooks */

  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  /* Logic Helpers */

  const setCoords = () => {
    if (!isEmpty(selectedSpot) && selectedSpot.geometry.type === 'Point') {
      location.coords = selectedSpot.geometry.coordinates;
    }
    return location.coords;
  };

  /* View */

  return (
    <MarkerView coordinate={setCoords()} id={'marker'}>
      <View style={{backgroundColor: 'transparent', padding: 5}}>
        <Icon
          name={'map-marker'}
          size={35}
          type={'material-community'}
        />
      </View>
    </MarkerView>
  );
};

export default MacrostratMarkerLayer;
