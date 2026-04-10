import React from 'react';

import MapboxGL from '@rnmapbox/maps';

import useXAxis from './useXAxis';
import useMapSymbology from '../symbology/useMapSymbology';

const XAxis = ({n = 1}) => {
  /* Data Hooks */

  const {getMapSymbology} = useMapSymbology();
  const {getXAxis, getXAxisTickMarks, isFlipped} = useXAxis(n);

  /* View */

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
          style={{
            ...getMapSymbology().xAxisTickMarkLabels,
            textOffset: isFlipped ? [1, -1] : [1, 1],
            textRotate: isFlipped ? 315 : 45,
          }}
        />
      </MapboxGL.ShapeSource>
    </>
  );
};

export default XAxis;
