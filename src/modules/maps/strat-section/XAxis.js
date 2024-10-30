import React from 'react';

import MapboxGL from '@rnmapbox/maps';

import useXAxis from './useXAxis';
import useMapSymbology from '../symbology/useMapSymbology';

const XAxis = ({n = 1}) => {
  const {getMapSymbology} = useMapSymbology();
  const {getXAxis, getXAxisTickMarks} = useXAxis(n);

  return (
    <>
      {/* X Axis Line*/}
      <MapboxGL.ShapeSource
        id={'xAxisSource' + n}
        shape={getXAxis()}
      >
        <MapboxGL.LineLayer
          id={'xAxisLayer' + n}
          minZoomLevel={1}
        />
      </MapboxGL.ShapeSource>

      {/* X Axis Tick Marks */}
      <MapboxGL.ShapeSource
        id={'xAxisTickMarksSource' + n}
        shape={getXAxisTickMarks()}
      >
        <MapboxGL.LineLayer
          id={'xAxisTickMarksLayer' + n}
          minZoomLevel={1}
        />
        <MapboxGL.SymbolLayer
          id={'xAxisTickMarksLabelLayer' + n}
          minZoomLevel={1}
          style={getMapSymbology().xAxisTickMarkLabels}
        />
      </MapboxGL.ShapeSource>
    </>
  );
};

export default XAxis;
