import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';

import useMapSymbology from '../symbology/useMapSymbology';

const DrawLayers = ({drawFeatures}) => {
  /* Data Hooks */

  const {getMapSymbology} = useMapSymbology();

  /* View */

  return (
    <MapboxGL.ShapeSource
      id={'drawFeatures'}
      shape={turf.featureCollection(drawFeatures)}
    >
      <MapboxGL.CircleLayer
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerDraw'}
        minZoomLevel={1}
        style={getMapSymbology().pointDraw}
      />
      <MapboxGL.CircleLayer
        belowLayerID={'pointLayerDraw'}
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerDrawHalo'}
        minZoomLevel={1}
        style={getMapSymbology().pointDrawHalo}
      />
      <MapboxGL.LineLayer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'lineLayerDraw'}
        minZoomLevel={1}
        style={getMapSymbology().lineDraw}
      />
      <MapboxGL.FillLayer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLayerDraw'}
        minZoomLevel={1}
        style={getMapSymbology().polygonDraw}
      />
    </MapboxGL.ShapeSource>
  );
};

export default DrawLayers;
