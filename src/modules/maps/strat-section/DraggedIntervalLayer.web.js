import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source} from 'react-map-gl/mapbox';
import {useSelector} from 'react-redux';

import {convertImagePixelsToLatLong} from '../maps.helpers';

const FILL_PAINT = {'fill-color': 'orange', 'fill-opacity': 0.7};
const BORDER_PAINT = {'line-color': 'white', 'line-width': 3};

const DraggedIntervalLayer = () => {
  /* Data Hooks */

  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  /* Derived Variables */

  if (!isDragIntervalMode) return null;

  const spot = selectedSpot;
  if (!spot?.geometry) return null;

  const spotConverted = convertImagePixelsToLatLong(JSON.parse(JSON.stringify(spot)));

  const polygons = spotConverted.geometry.type === 'GeometryCollection'
    ? spotConverted.geometry.geometries.map(g => ({...spotConverted, geometry: g}))
    : [spotConverted];

  /* View */

  return (
    <Source
      data={turf.featureCollection(polygons)}
      id={'draggedIntervalSource'}
      type={'geojson'}
    >
      <Layer
        id={'draggedIntervalFill'}
        paint={FILL_PAINT}
        type={'fill'}
      />
      <Layer
        id={'draggedIntervalBorder'}
        paint={BORDER_PAINT}
        type={'line'}
      />
    </Source>
  );
};

export default DraggedIntervalLayer;
