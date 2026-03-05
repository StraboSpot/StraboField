import React from 'react';

import {Layer, Source} from 'react-map-gl/mapbox';

import useXAxis from './useXAxis';
import useMapSymbology from '../symbology/useMapSymbology';

const XAxis = ({n = 1}) => {
  /* Data Hooks */

  const {getLayoutSymbology} = useMapSymbology();
  const {getXAxis, getXAxisTickMarks} = useXAxis(n);

  /* View */

  return (
    <>
      {/* X Axis Line*/}
      <Source
        data={getXAxis()}
        id={'xAxisSource' + n}
        type={'geojson'}
      >
        <Layer
          id={'xAxisLayer' + n}
          minZoomLevel={1}
          type={'line'}
        />
      </Source>

      {/* X Axis Tick Marks */}
      <Source
        data={getXAxisTickMarks()}
        id={'xAxisTickMarksSource' + n}
        type={'geojson'}
      >
        <Layer
          id={'xAxisTickMarksLayer' + n}
          minZoomLevel={1}
          type={'line'}
        />
        <Layer
          id={'xAxisTickMarksLabelLayer' + n}
          layout={getLayoutSymbology().xAxisTickMarkLabels}
          minZoomLevel={1}
          type={'symbol'}
        />
      </Source>
    </>
  );
};

export default XAxis;
