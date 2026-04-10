import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Marker, Source, useMap} from 'react-map-gl/mapbox';
import {useSelector} from 'react-redux';

const SNAP_LINE_PAINT = {'line-color': 'orange', 'line-width': 3};

const arrowContainerStyle = {display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2};
const arrowStyle = {color: 'orange', fontSize: 10, lineHeight: 1};

const SnapLineLayer = () => {
  /* Data Hooks */

  const intervalDragState = useSelector(state => state.map.intervalDragState);
  const {current: map} = useMap();

  /* Derived Variables */

  const lngLat = intervalDragState.snapLngLat;
  if (!lngLat) return null;

  const [lng, lat] = lngLat;
  const arrowLng = map?.getCenter().lng ?? lng;
  const snapLine = turf.lineString([[lng - 10000, lat], [lng + 10000, lat]]);

  /* View */

  return (
    <>
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
      <Marker
        anchor='center'
        latitude={lat}
        longitude={arrowLng}
      >
        <div style={arrowContainerStyle}>
          <span style={arrowStyle}>▲</span>
          <span style={arrowStyle}>▼</span>
        </div>
      </Marker>
    </>
  );
};

export default SnapLineLayer;
