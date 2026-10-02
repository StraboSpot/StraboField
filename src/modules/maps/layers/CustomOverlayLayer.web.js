import React, {memo} from 'react';

import {Layer, Source} from 'react-map-gl/mapbox';

import {getOverlayOpacity} from '../custom-maps/customMaps.helpers';

const CustomOverlayLayer = ({customMap, tileUrlTemplate}) => {
  /* View */

  // Defensive check to ensure customMap is valid
  if (!customMap || !customMap.id) {
    console.warn('CustomMapLayer: Invalid customMap provided', customMap);
    return null;
  }

  return (
    <Source
      id={customMap.id}
      key={customMap.id}
      tiles={[tileUrlTemplate]}
      type={'raster'}
    >
      <Layer
        id={customMap.id + 'Layer'}
        paint={{'raster-opacity': getOverlayOpacity(customMap)}}
        type={'raster'}
      />
    </Source>
  );
};

export default memo(CustomOverlayLayer);
