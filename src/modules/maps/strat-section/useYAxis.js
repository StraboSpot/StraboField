import * as turf from '@turf/turf';
import proj4 from 'proj4';

import {GEO_LAT_LNG_PROJECTION, PIXEL_PROJECTION} from '../maps.constants';
import useMapCoords from '../useMapCoords';

const useYAxis = (spotsDisplayed) => {
  const {convertImagePixelsToLatLong} = useMapCoords();

  const lineString = {type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: []}};
  const yMultiplier = 20;  // 1 m interval thickness = 20 pixels
  const intervals = spotsDisplayed.filter(
    feature => feature?.properties?.surface_feature?.surface_feature_type === 'strat_interval');

  // Get max X and max Y for strat intervals
  const maxXY = intervals.reduce((acc, i) => {
    const coords = i.geometry.coordinates || i.geometry.geometries.map(g => g.coordinates).flat();
    const xs = coords.flat().map(c => c[0]);
    const maxX = Math.max(...xs);
    const ys = coords.flat().map(c => c[1]);
    const maxY = Math.max(...ys);
    return [Math.max(acc[0], maxX), Math.max(acc[1], maxY)];
  }, [0, 0]);

  const getYAxis = () => {
    const yAxis = JSON.parse(JSON.stringify(lineString));
    yAxis.geometry.coordinates = [[0, 0], [0, maxXY[1] + 0.00025]];
    return yAxis;
  };

  const getYAxisTickMarks = () => {
    const yMaxCoord = proj4(GEO_LAT_LNG_PROJECTION, PIXEL_PROJECTION, [0, maxXY[1] + 0.00025]);
    const yMax = yMaxCoord[1];
    const tickMarks = [];
    let y = 0;
    while (y <= yMax) {
      const tickMark = JSON.parse(JSON.stringify(lineString));
      tickMark.properties.label = y / yMultiplier;
      tickMark.geometry.coordinates = [[0, y], [-5, y]];
      tickMarks.push(convertImagePixelsToLatLong(tickMark));
      y += yMultiplier;
    }
    return turf.featureCollection(tickMarks);
  };

  return {
    getYAxis,
    getYAxisTickMarks,
  };
};

export default useYAxis;
