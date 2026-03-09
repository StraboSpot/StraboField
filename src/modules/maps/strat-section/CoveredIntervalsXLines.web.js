import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';

import useCoveredIntervalXLines from './useCoveredIntevalsXLines';

const CoveredIntervalsXLines = ({spotsDisplayed}) => {
  /* Data Hooks */

  const {getIntervalsWithX} = useCoveredIntervalXLines(spotsDisplayed);

  /* View */

  return (
    <Source
      data={turf.featureCollection(getIntervalsWithX())}
      id={'coveredIntervalLines'}
      type={'geojson'}
    >
      <Layer
        id={'coveredIntervalLinesLayer'}
        minZoomLevel={1}
        type={'line'}
      />
    </Source>
  );
};

export default CoveredIntervalsXLines;
