import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';

import useMapSymbology from '../symbology/useMapSymbology';

const FeatureHalosLayers = ({featuresNotSelected, featuresSelected}) => {
  /* Data Hooks */

  const {getMapSymbology} = useMapSymbology();

  // Pin the halos just below the point symbols so the point icons stay on top (full stack order in FeaturesLayers).
  const belowLayerID = 'pointLayerNotSelected';

  /* View */

  return (
    <>
      {/* Halo Around Selected Point Feature Layer */}
      <MapboxGL.ShapeSource
        id={'pointFeaturesSelectedSource'}
        shape={turf.featureCollection(featuresSelected)}
      >
        <MapboxGL.CircleLayer
          belowLayerID={belowLayerID}
          filter={['==', ['geometry-type'], 'Point']}
          id={'pointLayerSelectedHalo'}
          minZoomLevel={1}
          style={getMapSymbology().pointSelected}
        />
      </MapboxGL.ShapeSource>

      {/* Colored Halo Around Points Layer */}
      {/* Include selected features too so a selected spot keeps its tag/geologic-unit color halo. */}
      <MapboxGL.ShapeSource
        id={'pointSourceColorHalo'}
        shape={turf.featureCollection([...featuresNotSelected, ...featuresSelected])}
      >
        <MapboxGL.CircleLayer
          belowLayerID={belowLayerID}
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
