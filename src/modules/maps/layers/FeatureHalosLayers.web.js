import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl';

import useMapSymbology from '../symbology/useMapSymbology';

const FeatureHalosLayers = ({featuresNotSelected, featuresSelected}) => {
  const {getPaintSymbology} = useMapSymbology();

  return (
    <>
      {/* Halo Around Selected Point Feature Layer */}
      <Source
        id={'pointFeaturesSelectedSource'}
        type={'geojson'}
        data={turf.featureCollection(featuresSelected)}
      >
        <Layer
          type={'circle'}
          id={'pointLayerSelectedHalo'}
          filter={['==', ['geometry-type'], 'Point']}
          paint={getPaintSymbology().pointSelected}
        />
      </Source>

      {/* Colored Halo Around Points Layer */}
      <Source
        id={'pointSourceColorHalo'}
        type={'geojson'}
        data={turf.featureCollection(featuresNotSelected)}
      >
        <Layer
          type={'circle'}
          id={'pointLayerColorHalo'}
          filter={['==', ['geometry-type'], 'Point']}
          paint={getPaintSymbology().pointColorHalo}
        />
      </Source>
    </>
  );
};

export default FeatureHalosLayers;
