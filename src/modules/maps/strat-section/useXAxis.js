import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

import {
  BASIC_LITHOLOGIES_LABELS,
  CARBONATE_KEYS,
  EMPTY_LINE_STRING_FEATURE,
  GRAIN_SIZE_KEYS,
  LITHOLOGIES_KEYS,
} from './stratSection.constants';
import {useForm} from '../../form';
import {useSpots} from '../../spots';
import useMapCoords from '../view/useMapCoords';

const s = 20; // spacing between multiple x axes
const xCa = 23.3; // Horizontal space between carbonate tick marks
const xCl = 10;  // Horizontal spacing between clastic tick marks
const xMi = 26.6; // Horizontal space between miscellaneous lithologies tick marks

const useXAxis = (n) => {
  /* Data Hooks */

  const stratSection = useSelector(state => state.map.stratSection);

  const {getChoices, getChoicesByKey, getSurvey} = useForm();
  const {convertImagePixelsToLatLong} = useMapCoords();
  const {getAllIntervalSpotsOnStratSection} = useSpots();

  /* Derived Variables */

  // Flip x-axis to above y=0 when the section extends further negative than positive. Measured over all the
  // intervals so switching a dataset off cannot flip the axis to the other end of the column.
  const intervals = getAllIntervalSpotsOnStratSection(stratSection.strat_section_id);
  const {maxY, minY} = intervals.reduce((acc, i) => {
    const coords = i.geometry.coordinates || i.geometry.geometries.map(g => g.coordinates).flat();
    const ys = coords.flat().map(c => c[1]);
    return {maxY: Math.max(acc.maxY, Math.max(...ys)), minY: Math.min(acc.minY, Math.min(...ys))};
  }, {maxY: 0, minY: 0});
  const isFlipped = Math.abs(minY) > Math.abs(maxY);

  /* Exported Functions */

  const getXAxis = () => {
    const xAxis = JSON.parse(JSON.stringify(EMPTY_LINE_STRING_FEATURE));
    const yPos = n === 1 ? 0 : (isFlipped ? n * s : -n * s);
    xAxis.geometry.coordinates = [[0, yPos], [15 * xCl + 5, yPos]];
    return convertImagePixelsToLatLong(xAxis);
  };

  const getXAxisTickMarks = () => {
    const survey = getSurvey(['sed', 'add_interval']);
    const choices = getChoices(['sed', 'add_interval']);
    // The misc axis is n=3 for mixed_clastic (which already uses n=1 and n=2), n=2 for all others
    const miscAxisN = stratSection.column_profile === 'mixed_clastic' ? 3 : 2;
    const isMiscAxis = stratSection.misc_labels && n === miscAxisN;

    let fieldKeys = [];
    let x = xCl;
    if (isMiscAxis) {
      fieldKeys = LITHOLOGIES_KEYS;
      x = xMi;
    }
    else if (stratSection.column_profile === 'clastic') fieldKeys = GRAIN_SIZE_KEYS;
    else if (stratSection.column_profile === 'carbonate') {
      fieldKeys = CARBONATE_KEYS;
      x = xCa;
    }
    else if (stratSection.column_profile === 'mixed_clastic') {
      if (n === 1) fieldKeys = GRAIN_SIZE_KEYS;
      else if (n === 2) {
        fieldKeys = CARBONATE_KEYS;
        x = xCa;
      }
    }

    const fields = survey.reduce((acc, key) => {
      return fieldKeys.includes(key.name) ? [...acc, ...getChoicesByKey(survey, choices, key.name)] : acc;
    }, []);
    const labels = stratSection.column_profile === 'basic_lithologies' && !isMiscAxis ? BASIC_LITHOLOGIES_LABELS
      : fields.map(f => f.label);

    if (isMiscAxis) labels.splice(0, 3);      // Remove first 3 labels for misc axis

    const tickMarks = [];
    Array.from({length: labels.length}, (_, i) => {
      const tickMark = JSON.parse(JSON.stringify(EMPTY_LINE_STRING_FEATURE));
      tickMark.properties.label = labels[i];
      const yPos = n === 1 ? 0 : (isFlipped ? n * s : -n * s);
      tickMark.geometry.coordinates = isFlipped ? [[x, yPos], [x, yPos + 5]] : [[x, yPos], [x, yPos - 5]];
      tickMarks.push(convertImagePixelsToLatLong(tickMark));
      x += xCl;
    });
    return turf.featureCollection(tickMarks);
  };

  return {
    getXAxis,
    getXAxisTickMarks,
    isFlipped,
  };
};

export default useXAxis;
