import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';

import useMapSymbology from '../symbology/useMapSymbology';

const FeatureHalosLayers = ({featuresNotSelected, featuresSelected}) => {
  /* Data Hooks */

  const {getMapSymbology} = useMapSymbology();

  /* View */

  return (
    <>
      {/* Halo Around Selected Point Feature Layer */}
      <MapboxGL.ShapeSource
        id={'pointFeaturesSelectedSource'}
        shape={turf.featureCollection(featuresSelected)}
      >
        <MapboxGL.CircleLayer
          filter={['==', ['geometry-type'], 'Point']}
          id={'pointLayerSelectedHalo'}
          minZoomLevel={1}
          style={getMapSymbology().pointSelected}
        />
      </MapboxGL.ShapeSource>

      {/* Colored Halo Around Points Layer */}
      <MapboxGL.ShapeSource
        id={'pointSourceColorHalo'}
        shape={turf.featureCollection(featuresNotSelected)}
      >
        <MapboxGL.CircleLayer
          filter={['==', ['geometry-type'], 'Point']}
          id={'pointLayerColorHalo'}
          minZoomLevel={1}
          style={getMapSymbology().pointColorHalo}
        />
      </MapboxGL.ShapeSource>
    </>
  );
};

export default FeatureHalosLayers;
