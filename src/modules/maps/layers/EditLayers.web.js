import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl';

import useMapSymbology from '../symbology/useMapSymbology';

const EditLayers = ({editFeatureVertex}) => {

  const {getPaintSymbology} = useMapSymbology();

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
