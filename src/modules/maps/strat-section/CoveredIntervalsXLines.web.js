import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';

import useCoveredIntervalsXLines from './useCoveredIntervalsXLines';

const CoveredIntervalsXLines = ({spotsDisplayed}) => {
  /* Data Hooks */

  const {getIntervalsWithX} = useCoveredIntervalsXLines(spotsDisplayed);

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
