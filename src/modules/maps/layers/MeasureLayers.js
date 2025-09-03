import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';

import useMapSymbology from '../symbology/useMapSymbology';

const MeasureLayers = ({measureFeatures}) => {

  const {getMapSymbology} = useMapSymbology();

  return (
    <MapboxGL.ShapeSource
      id={'mapMeasure'}
      shape={turf.featureCollection(measureFeatures)}
    >
      <MapboxGL.CircleLayer
        filter={['==', ['geometry-type'], 'Point']}
        id={'measureLayerPoints'}
        minZoomLevel={1}
        style={getMapSymbology().pointMeasure}
      />
      <MapboxGL.LineLayer
        filter={['==', ['geometry-type'], 'LineString']}
        id={'measureLayerLines'}
        minZoomLevel={1}
        style={getMapSymbology().lineMeasure}
      />
    </MapboxGL.ShapeSource>
  );
};

export default MeasureLayers;
