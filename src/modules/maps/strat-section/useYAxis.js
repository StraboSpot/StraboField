import * as turf from '@turf/turf';
import proj4 from 'proj4';

import {EMPTY_LINE_STRING_FEATURE} from './stratSection.constants';
import {Y_MULTIPLIER} from '../../sed/sed.constants';
import {GEO_LAT_LNG_PROJECTION, PIXEL_PROJECTION} from '../maps.constants';
import useMapCoords from '../useMapCoords';

const AXIS_BUFFER = Y_MULTIPLIER / 2; // pixels beyond outermost tick mark

const useYAxis = (spotsDisplayed) => {
  /* Data Hooks */

  const {convertImagePixelsToLatLong} = useMapCoords();

  /* Derived Variables */

  const intervals = spotsDisplayed.filter(
    feature => feature?.properties?.surface_feature?.surface_feature_type === 'strat_interval');
  // Get max Y and min Y across all intervals to support sections spanning positive and negative values
  const {maxY, minY} = intervals.reduce((acc, i) => {
    const coords = i.geometry.coordinates || i.geometry.geometries.map(g => g.coordinates).flat();
    const ys = coords.flat().map(c => c[1]);
    return {
      maxY: Math.max(acc.maxY, Math.max(...ys)),
      minY: Math.min(acc.minY, Math.min(...ys)),
    };
  }, {maxY: 0, minY: 0});

  // Convert interval extents to pixel coords and find outermost tick marks
  // Always include 0 so the origin is labeled and the axis extends to/past it in both directions
  const yMinPixel = proj4(GEO_LAT_LNG_PROJECTION, PIXEL_PROJECTION, [0, minY])[1];
  const bottomTickPixel = Math.min(0, Math.floor(yMinPixel / Y_MULTIPLIER) * Y_MULTIPLIER);
  const yMaxPixel = proj4(GEO_LAT_LNG_PROJECTION, PIXEL_PROJECTION, [0, maxY])[1];
  const topTickPixel = Math.max(0, Math.floor(yMaxPixel / Y_MULTIPLIER) * Y_MULTIPLIER);

  /* Exported Functions */

  const getYAxis = () => {
    const axisTop = proj4(PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION, [0, topTickPixel + AXIS_BUFFER]);
    const axisBottom = proj4(PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION, [0, bottomTickPixel - AXIS_BUFFER]);
    const yAxis = JSON.parse(JSON.stringify(EMPTY_LINE_STRING_FEATURE));
    yAxis.geometry.coordinates = [[0, axisBottom[1]], [0, axisTop[1]]];
    return yAxis;
  };

  const getYAxisTickMarks = () => {
    const tickMarks = [];
    let y = bottomTickPixel;
    while (y <= topTickPixel) {
      const tickMark = JSON.parse(JSON.stringify(EMPTY_LINE_STRING_FEATURE));
      tickMark.properties.label = y / Y_MULTIPLIER;
      tickMark.geometry.coordinates = [[0, y], [-5, y]];
      tickMarks.push(convertImagePixelsToLatLong(tickMark));
      y += Y_MULTIPLIER;
    }
    return turf.featureCollection(tickMarks);
  };

  return {
    getYAxis,
    getYAxisTickMarks,
  };
};

export default useYAxis;
