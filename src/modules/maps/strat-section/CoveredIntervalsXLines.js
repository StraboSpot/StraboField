import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';

import useCoveredIntervalsXLines from './useCoveredIntervalsXLines';

const CoveredIntervalsXLines = ({spotsDisplayed}) => {
  /* Data Hooks */

  const {getIntervalsWithX} = useCoveredIntervalsXLines(spotsDisplayed);

  /* View */

  return (
    <MapboxGL.ShapeSource
      id={'coveredIntervalLines'}
      shape={turf.featureCollection(getIntervalsWithX())}
    >
      <MapboxGL.LineLayer
        id={'coveredIntervalLinesLayer'}
        minZoomLevel={1}
      />
    </MapboxGL.ShapeSource>
  );
};

export default CoveredIntervalsXLines;
