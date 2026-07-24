import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';

import useMapSymbology from '../symbology/useMapSymbology';

const FeatureHalosLayers = ({featuresNotSelected, featuresSelected}) => {
  /* Data Hooks */

  const {getPaintSymbology} = useMapSymbology();

  // Pin the halos just below the point symbols so the point icons stay on top (full stack order in FeaturesLayers).
  const beforeId = 'pointLayerNotSelected';

  /* View */

  return (
    <>
      {/* Halo Around Selected Point Feature Layer */}
      <Source
        data={turf.featureCollection(featuresSelected)}
        id={'pointFeaturesSelectedSource'}
        type={'geojson'}
      >
        <Layer
          beforeId={beforeId}
          filter={['==', ['geometry-type'], 'Point']}
          id={'pointLayerSelectedHalo'}
          paint={getPaintSymbology().pointSelected}
          type={'circle'}
        />
      </Source>

      {/* Colored Halo Around Points Layer */}
      {/* Include selected features too so a selected spot keeps its tag/geologic-unit color halo. */}
      <Source
        data={turf.featureCollection([...featuresNotSelected, ...featuresSelected])}
        id={'pointSourceColorHalo'}
        type={'geojson'}
      >
        <Layer
          beforeId={beforeId}
          filter={['==', ['geometry-type'], 'Point']}
          id={'pointLayerColorHalo'}
          paint={getPaintSymbology().pointColorHalo}
          type={'circle'}
        />
      </Source>
    </>
  );
};

export default FeatureHalosLayers;
