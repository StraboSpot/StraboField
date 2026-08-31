import React from 'react';

import {Layer, Source} from 'react-map-gl/mapbox';

const StratSectionImageOverlay = ({belowLayerId, coordQuad, id, imageOpacity, url}) => {
  console.log('Rendering StratSectionImageOverlay...');

  /* View */

  return (
    <Source
      coordinates={coordQuad}
      id={'imageOverlay' + id}
      type={'image'}
      url={url}
    >
      <Layer
        beforeId={belowLayerId}
        id={'imageOverlayLayer' + id}
        paint={{'raster-opacity': imageOpacity}}
        type={'raster'}
      />
    </Source>
  );
};

export default StratSectionImageOverlay;
