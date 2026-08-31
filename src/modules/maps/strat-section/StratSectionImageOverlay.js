import React from 'react';

import MapboxGL from '@rnmapbox/maps';

const StratSectionImageOverlay = ({belowLayerId, coordQuad, id, imageOpacity, url}) => {
  console.log('Rendering StratSectionImageOverlay...');

  /* View */

  return (
    <MapboxGL.ImageSource
      coordinates={coordQuad}
      id={'imageOverlay' + id}
      url={url}
    >
      <MapboxGL.RasterLayer
        belowLayerID={belowLayerId}
        id={'imageOverlayLayer' + id}
        style={{rasterOpacity: imageOpacity}}
      />
    </MapboxGL.ImageSource>
  );
};

export default StratSectionImageOverlay;
