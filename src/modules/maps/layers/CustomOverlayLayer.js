import React, {memo} from 'react';

import MapboxGL from '@rnmapbox/maps';

import {getOverlayOpacity} from '../custom-maps/customMaps.helpers';

const CustomOverlayLayer = ({basemap, customMap, tileUrlTemplate}) => {
  /* View */

  // Defensive checks to ensure customMap and basemap are valid
  if (!customMap || !customMap.id) {
    console.warn('CustomOverlayLayer: Invalid customMap provided', customMap);
    return null;
  }

  if (!basemap || !basemap.id) {
    console.warn('CustomOverlayLayer: Invalid basemap provided', basemap);
    return null;
  }

  return (
    <MapboxGL.RasterSource
      id={customMap.id}
      key={customMap.id}
      tileSize={256}
      tileUrlTemplates={[tileUrlTemplate]}
    >
      <MapboxGL.RasterLayer
        aboveLayerID={basemap.id}
        id={customMap.id + 'Layer'}
        key={customMap.id + 'Layer'}
        sourceID={customMap.id}
        style={{
          rasterOpacity: getOverlayOpacity(customMap),
          visibility: 'visible',
        }}
      />
    </MapboxGL.RasterSource>
  );
};

// Custom comparison function to ensure re-renders when relevant props change
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.customMap.id === nextProps.customMap.id
    && getOverlayOpacity(prevProps.customMap) === getOverlayOpacity(nextProps.customMap)
    && prevProps.tileUrlTemplate === nextProps.tileUrlTemplate
    && prevProps.basemap.id === nextProps.basemap.id
  );
};

export default memo(CustomOverlayLayer, areEqual);
