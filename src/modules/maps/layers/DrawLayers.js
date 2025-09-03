import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';

import useMapSymbology from '../symbology/useMapSymbology';

const DrawLayers = ({drawFeatures}) => {

  const {getMapSymbology} = useMapSymbology();

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
