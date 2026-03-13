import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';
import {useSelector} from 'react-redux';

const SNAP_LINE_PAINT = {'line-color': 'orange', 'line-width': 3};

const SnapLineLayer = () => {
  /* Data Hooks */

  const intervalDragState = useSelector(state => state.map.intervalDragState);

  /* Derived Variables */

  if (!intervalDragState) return null;

  const lngLat = intervalDragState.snapLngLat;
  if (!lngLat) return null;

  const [lng, lat] = lngLat;
  const snapLine = turf.lineString([[lng - 10000, lat], [lng + 10000, lat]]);

  /* View */

  return (
    <Source
      data={snapLine}
      id={'snapLineSource'}
      type={'geojson'}
    >
      <Layer
        id={'snapLineLayer'}
        paint={SNAP_LINE_PAINT}
        type={'line'}
      />
    </Source>
  );
};

export default SnapLineLayer;
