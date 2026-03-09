import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';

import useMapSymbology from '../symbology/useMapSymbology';

const MeasureLayers = ({measureFeatures}) => {
  /* Data Hooks */

  const {getPaintSymbology} = useMapSymbology();

  /* View */

  return (
    <Source
      data={turf.featureCollection(measureFeatures)}
      id={'mapMeasure'}
      type={'geojson'}
    >
      <Layer
        filter={['==', ['geometry-type'], 'Point']}
        id={'measureLayerPoints'}
        paint={getPaintSymbology().pointMeasure}
        type={'circle'}
      />
      <Layer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'measureLayerLines'}
        paint={getPaintSymbology().lineMeasure}
        type={'line'}
      />
    </Source>
  );
};

export default MeasureLayers;
