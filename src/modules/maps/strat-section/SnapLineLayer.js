import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

const SNAP_LINE_STYLE = {lineColor: 'orange', lineWidth: 3};

const SnapLineLayer = () => {
  /* Data Hooks */

  const intervalDragState = useSelector(state => state.map.intervalDragState);

  /* Derived Variables */

  if (!intervalDragState) return null;

  const {slotMap, targetSlotIndex} = intervalDragState;
  const lngLat = slotMap?.[targetSlotIndex]?.lngLat;
  if (!lngLat) return null;

  const [lng, lat] = lngLat;
  const snapLine = turf.lineString([[lng - 10000, lat], [lng + 10000, lat]]);

  /* View */

  return (
    <MapboxGL.ShapeSource
      id={'snapLineSource'}
      shape={snapLine}
    >
      <MapboxGL.LineLayer
        id={'snapLineLayer'}
        minZoomLevel={1}
        style={SNAP_LINE_STYLE}
      />
    </MapboxGL.ShapeSource>
  );
};

export default SnapLineLayer;
