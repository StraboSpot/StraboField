import React from 'react';

import MapboxGL from '@rnmapbox/maps';

const StratSectionImageOverlay = ({coordQuad, id, imageOpacity, url}) => {
  console.log('Rendering StratSectionImageOverlay...');

  /* View */

  return (
    <MapboxGL.ImageSource
      coordinates={coordQuad}
      id={'imageOverlay' + id}
      url={url}
    >
      <MapboxGL.RasterLayer
        belowLayerID={'pointLayerSelectedHalo'}
        id={'imageOverlayLayer' + id}
        style={{rasterOpacity: imageOpacity || 1}}
      />
    </MapboxGL.ImageSource>
  );
};

export default StratSectionImageOverlay;
