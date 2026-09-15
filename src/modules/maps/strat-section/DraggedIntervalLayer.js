import React from 'react';

import MapboxGL from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

import {ORANGE} from '../../../shared/styles.constants';
import {convertImagePixelsToLatLong} from '../maps.helpers';

const FILL_STYLE = {fillColor: ORANGE, fillOpacity: 0.7};
const BORDER_STYLE = {lineColor: 'white', lineWidth: 3};

const DraggedIntervalLayer = () => {
  /* Data Hooks */

  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  /* Derived Variables */

  if (!isDragIntervalMode) return null;

  const spot = selectedSpot;
  if (!spot?.geometry) return null;

  // Deep copy and convert from pixel coords (EPSG:3857) to lat/lng (WGS84) for Mapbox
  const spotConverted = convertImagePixelsToLatLong(JSON.parse(JSON.stringify(spot)));

  // Expand GeometryCollection into individual polygon features
  const polygons = spotConverted.geometry.type === 'GeometryCollection'
    ? spotConverted.geometry.geometries.map(g => ({...spotConverted, geometry: g}))
    : [spotConverted];

  /* View */

  return (
    <MapboxGL.ShapeSource
      id={'draggedIntervalSource'}
      shape={turf.featureCollection(polygons)}
    >
      <MapboxGL.FillLayer
        id={'draggedIntervalFill'}
        minZoomLevel={1}
        style={FILL_STYLE}
      />
      <MapboxGL.LineLayer
        id={'draggedIntervalBorder'}
        minZoomLevel={1}
        style={BORDER_STYLE}
      />
    </MapboxGL.ShapeSource>
  );
};

export default DraggedIntervalLayer;
