import React from 'react';

import * as turf from '@turf/turf';
import {Layer, Source, useMap} from 'react-map-gl/mapbox';
import {useSelector} from 'react-redux';

import {LARGE_TEXT_SIZE, ORANGE} from '../../../shared/styles.constants';
import {GLYPH_FONT} from '../glyphs/glyphs.constants';

const SNAP_LINE_PAINT = {'line-color': ORANGE, 'line-width': 3};

const SNAP_ARROWS_LAYOUT = {
  'text-field': '▲\n▼',
  'text-font': GLYPH_FONT,
  'text-allow-overlap': true,
  'text-ignore-placement': true,
  'text-line-height': 1,
  'text-size': LARGE_TEXT_SIZE,
};
const SNAP_ARROWS_PAINT = {'text-color': ORANGE};

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
      <Source
        data={turf.point([arrowLng, lat])}
        id={'snapArrowsSource'}
        type={'geojson'}
      >
        <Layer
          id={'snapArrowsLayer'}
          layout={SNAP_ARROWS_LAYOUT}
          paint={SNAP_ARROWS_PAINT}
          type={'symbol'}
        />
      </Source>
    </>
  );
};

export default SnapLineLayer;
