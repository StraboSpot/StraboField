import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl';

import useMapSymbology from '../symbology/useMapSymbology';

const FeaturesNotSelectedLayers = ({features}) => {

  const {getPaintSymbology} = useMapSymbology();

  return (
    <Source
      data={turf.featureCollection(features)}
      id={'spotsSourceReadOnly'}
      type={'geojson'}
    >
      {/* Read Only Polygon */}
      <Layer
        filter={['==', ['geometry-type'], 'Polygon']}
        id={'polygonLayerReadOnly'}
        paint={getPaintSymbology().polygonReadOnly}
        type={'fill'}
      />

      {/* Read Only Line */}
      <Layer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'lineLayerReadOnly'}
        paint={getPaintSymbology().lineReadOnly}
        type={'line'}
      />

      {/* Read Only Point */}
      <Layer
        filter={['==', ['geometry-type'], 'Point']}
        id={'pointLayerReadOnly'}
        paint={getPaintSymbology().pointCircleReadOnly}
        type={'circle'}
      />
    </Source>
  );
};

export default FeaturesNotSelectedLayers;
