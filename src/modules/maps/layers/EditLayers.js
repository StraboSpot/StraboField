import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';

import useMapSymbology from '../symbology/useMapSymbology';

const EditLayers = ({editFeatureVertex}) => {
  /* Data Hooks */

  const {getMapSymbology} = useMapSymbology();

  /* View */

  return (
    <MapboxGL.ShapeSource
      id={'editFeatureVertex'}
      shape={turf.featureCollection(editFeatureVertex)}
    >
      <MapboxGL.CircleLayer
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerEdit'}
        minZoomLevel={1}
        style={getMapSymbology().pointEdit}
      />
    </MapboxGL.ShapeSource>
  );
};

export default EditLayers;
