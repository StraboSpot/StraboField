import * as turf from '@turf/turf';
import proj4 from 'proj4';
import {useSelector} from 'react-redux';

import {EMPTY_LINE_STRING_FEATURE} from './stratSection.constants';
import useStratSection from './useStratSection';
import {Y_MULTIPLIER} from '../../sed/sed.constants';
import {useSpots} from '../../spots';
import {PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION} from '../maps.constants';
import useMapCoords from '../view/useMapCoords';

const AXIS_BUFFER = Y_MULTIPLIER / 2; // pixels beyond outermost tick mark

const useYAxis = () => {
  /* Data Hooks */

  const stratSection = useSelector(state => state.map.stratSection);
  const {convertImagePixelsToLatLong} = useMapCoords();
  const {getIntervalSpotsThisStratSection} = useSpots();
  const {isNegativeColumn} = useStratSection();

  /* Derived Variables */

  // Read intervals directly from Redux in pixel coordinates
  const intervals = getIntervalSpotsThisStratSection(stratSection?.strat_section_id);
  // Get max Y and min Y across all intervals to support sections spanning positive and negative values
  const {maxY, minY} = intervals.reduce((acc, i) => {
    const coords = i.geometry.coordinates || i.geometry.geometries.map(g => g.coordinates).flat();
    const ys = coords.flat().map(c => c[1]);
    return {
      maxY: Math.max(acc.maxY, Math.max(...ys)),
      minY: Math.min(acc.minY, Math.min(...ys)),
    };
  }, {maxY: 0, minY: 0});

  // Find outermost tick marks in pixel space
  // Always include 0 so the origin is labeled and the axis extends to/past it in both directions
  const hasNegativeIntervals = minY < 0;
  const rawBottomTickPixel = Math.min(0, Math.floor(minY / Y_MULTIPLIER) * Y_MULTIPLIER);
  const bottomTickPixel = isNegativeColumn() || hasNegativeIntervals ? rawBottomTickPixel : 0;
  const topTickPixel = Math.max(0, Math.ceil(maxY / Y_MULTIPLIER) * Y_MULTIPLIER);

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
