import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';

import useMapSymbology from '../symbology/useMapSymbology';

const FeaturesNotSelectedLayers = ({features}) => {

  const {getMapSymbology} = useMapSymbology();

  return (
    <MapboxGL.ShapeSource
      id={'spotsSourceReadOnly'}
      shape={turf.featureCollection(features)}
    >
      {/* Read Only Polygon */}
      <MapboxGL.FillLayer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLayerReadOnly'}
        minZoomLevel={1}
        style={getMapSymbology().polygonReadOnly}
      />

      {/* Read Only Line */}
      <MapboxGL.LineLayer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'lineLayerReadOnly'}
        minZoomLevel={1}
        style={getMapSymbology().lineReadOnly}
      />

      {/* Read Only Point */}
      <MapboxGL.CircleLayer
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerEditReadOnly'}
        minZoomLevel={1}
        style={getMapSymbology().pointCircleReadOnly}
      />
    </MapboxGL.ShapeSource>
  );
};

export default FeaturesNotSelectedLayers;
