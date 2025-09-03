import React from 'react';

import {Icon} from '@rn-vui/base';
import {Marker} from 'react-map-gl';
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
    <Marker
      angle={'bottom'}
      latitude={setCoords()[1]}
      longitude={setCoords()[0]}
    >
      <Icon
        name={'map-marker'}
        size={30}
        type={'material-community'}
      />
    </Marker>
  );
};

export default MacrostratMarkerLayer;
