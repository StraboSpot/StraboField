import React from 'react';

import MapboxGL from '@rnmapbox/maps';

import useYAxis from './useYAxis';
import useMapSymbology from '../symbology/useMapSymbology';

const YAxis = ({spotsDisplayed}) => {
  /* Data Hooks */

  const {getMapSymbology} = useMapSymbology();
  const {getYAxis, getYAxisTickMarks} = useYAxis(spotsDisplayed);

  /* View */

  return (
    <>
      {/* Y Axis Line */}
      <MapboxGL.ShapeSource
        id={'yAxisSource'}
        shape={getYAxis()}
      >
        <MapboxGL.LineLayer
          id={'yAxisLayer'}
          minZoomLevel={1}
        />
      </MapboxGL.ShapeSource>

      {/* Y Axis Tick Marks */}
      <MapboxGL.ShapeSource
        id={'yAxisTickMarksSource'}
        shape={getYAxisTickMarks()}
      >
        <MapboxGL.LineLayer
          id={'yAxisTickMarksLayer'}
          minZoomLevel={1}
        />
        <MapboxGL.SymbolLayer
          id={'yAxisTickMarksLabelLayer'}
          minZoomLevel={1}
          style={getMapSymbology().yAxisTickMarkLabels}
        />
      </MapboxGL.ShapeSource>
    </>
  );
};

export default YAxis;
