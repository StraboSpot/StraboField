import React from 'react';
import {View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {PointAnnotation} from '@rnmapbox/maps';
import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/Helpers';

const MacrostratMarkerLayer = ({location}) => {
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const setCoords = () => {
    if (!isEmpty(selectedSpot) && selectedSpot.geometry.type === 'Point') {
      location.coords = selectedSpot.geometry.coordinates;
    }
    return location.coords;
  };

  return (
    <PointAnnotation id={'marker'} coordinate={setCoords()}>
      <View style={{backgroundColor: 'transparent', padding: 5}}>
        <Icon
          size={35}
          name={'map-marker'}
          type={'material-community'}
        />
      </View>
    </PointAnnotation>
  );
};

export default MacrostratMarkerLayer;
