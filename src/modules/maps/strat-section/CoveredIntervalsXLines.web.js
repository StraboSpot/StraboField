import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl';

import useCoveredIntervalXLines from './useCoveredIntevalsXLines';

const CoveredIntervalsXLines = ({spotsDisplayed}) => {
  const {getIntervalsWithX} = useCoveredIntervalXLines(spotsDisplayed);

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
