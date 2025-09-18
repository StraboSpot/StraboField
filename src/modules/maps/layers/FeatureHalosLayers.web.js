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
        data={turf.featureCollection(featuresSelected)}
        id={'pointFeaturesSelectedSource'}
        type={'geojson'}
      >
        <Layer
          filter={['==', ['geometry-type'], 'Point']}
          id={'pointLayerSelectedHalo'}
          paint={getPaintSymbology().pointSelected}
          type={'circle'}
        />
      </Source>

      {/* Colored Halo Around Points Layer */}
      <Source
        data={turf.featureCollection(featuresNotSelected)}
        id={'pointSourceColorHalo'}
        type={'geojson'}
      >
        <Layer
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
