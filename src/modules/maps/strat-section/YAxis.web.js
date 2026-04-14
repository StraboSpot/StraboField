import React from 'react';

import {Layer, Source} from 'react-map-gl/mapbox';

import useYAxis from './useYAxis';
import useMapSymbology from '../symbology/useMapSymbology';

const YAxis = () => {
  /* Data Hooks */

  const {getLayoutSymbology} = useMapSymbology();
  const {getYAxis, getYAxisTickMarks} = useYAxis();

  /* View */

  return (
    <>
      {/* Y Axis Line */}
      <Source
        data={getYAxis()}
        id={'yAxisSource'}
        type={'geojson'}
      >
        <Layer
          id={'yAxisLayer'}
          minZoomLevel={1}
          type={'line'}
        />
      </Source>

      {/* Y Axis Tick Marks */}
      <Source
        data={getYAxisTickMarks()}
        id={'yAxisTickMarksSource'}
        type={'geojson'}
      >
        <Layer
          id={'yAxisTickMarksLayer'}
          minZoomLevel={1}
          type={'line'}
        />
        <Layer
          id={'yAxisTickMarksLabelLayer'}
          layout={getLayoutSymbology().yAxisTickMarkLabels}
          minZoomLevel={1}
          type={'symbol'}
        />
      </Source>
    </>
  );
};

export default YAxis;
