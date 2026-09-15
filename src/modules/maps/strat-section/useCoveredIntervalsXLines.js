import * as turf from '@turf/turf';

const useCoveredIntervalsXLines = (spotsDisplayed) => {
  /* Exported Functions */

  // Create the X lines for Strat Intervals that are Covered/Unexposed or Not Measured
  const getIntervalsWithX = () => {
    const spotsX = spotsDisplayed.filter(
      s => s.properties?.sed?.character === 'unexposed_cove' || s.properties?.sed?.character === 'not_measured');
    const xLines = [];
    spotsX.forEach((s) => {
      const bbox = turf.bbox(s);
      const poly = turf.bboxPolygon(bbox);
      const coords = turf.getCoords(poly);
      xLines.push(turf.lineString([coords[0][0], coords[0][2]]));
      xLines.push(turf.lineString([coords[0][1], coords[0][3]]));
    });
    return xLines;
  };

  return {
    getIntervalsWithX,
  };
};

export default useCoveredIntervalsXLines;
