import React from 'react';

import {Icon} from '@rn-vui/base';
import {Marker} from 'react-map-gl/mapbox';
import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';

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
