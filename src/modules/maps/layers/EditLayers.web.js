import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';

import useMapSymbology from '../symbology/useMapSymbology';

const EditLayers = ({editFeatureVertex}) => {
  /* Data Hooks */

  const {getPaintSymbology} = useMapSymbology();

  /* View */

  return (
    <Source
      data={turf.featureCollection(editFeatureVertex)}
      id={'editFeatureVertex'}
      type={'geojson'}
    >
      <Layer
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerEdit'}
        paint={getPaintSymbology().pointEdit}
        type={'circle'}
      />
    </Source>
  );
};

export default EditLayers;
