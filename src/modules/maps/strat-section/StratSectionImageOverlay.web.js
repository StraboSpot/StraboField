import React from 'react';

import {Layer, Source} from 'react-map-gl/mapbox';

const StratSectionImageOverlay = ({coordQuad, id, imageOpacity, url}) => {
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
        // beforeId={'pointLayerColoHalo'}
        id={'imageOverlayLayer' + id}
        paint={{
          'raster-opacity': imageOpacity && parseFloat(imageOpacity.toString())
          && parseFloat(imageOpacity.toString()) >= 0 && parseFloat(imageOpacity.toString()) <= 1
            ? parseFloat(imageOpacity.toString()) : 1,
        }}
        slot={'top'}
        type={'raster'}
      />
    </Source>
  );
};

export default StratSectionImageOverlay;
