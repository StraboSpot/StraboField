import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

import {BASIC_LITHOLOGIES_LABELS, CARBONATE_KEYS, GRAIN_SIZE_KEYS, LITHOLOGIES_KEYS} from './stratSection.constants';
import {useFormHook} from '../../form';
import useMapsHook from '../useMaps';

const useXAxis = (n) => {
  const stratSection = useSelector(state => state.map.stratSection);

  const useMaps = useMapsHook();
  const useForm = useFormHook();

  const xCl = 10;  // Horizontal spacing between clastic tick marks
  const xCa = 23.3; // Horizontal space between carbonate tick marks
  const xMi = 26.6; // Horizontal space between miscellaneous lithologies tick marks
  const s = 20; // spacing between multiple x axes

  const lineString = {
    type: 'Feature',
    properties: {},
    geometry: {type: 'LineString', coordinates: []},
  };

  const getXAxis = () => {
    const xAxis = JSON.parse(JSON.stringify(lineString));
    xAxis.geometry.coordinates = n === 1 ? [[0, 0], [15 * xCl + 5, 0]] : [[0, -n * s], [15 * xCl + 5, -n * s]];
    return useMaps.convertImagePixelsToLatLong(xAxis);
  };

  const getXAxisTickMarks = () => {
    const survey = useForm.getSurvey(['sed', 'add_interval']);
    const choices = useForm.getChoices(['sed', 'add_interval']);
    let fieldKeys = [];
    let x = xCl;
    if (stratSection.column_profile === 'clastic') fieldKeys = GRAIN_SIZE_KEYS;
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
    if (stratSection.misc_labels) {
      fieldKeys = LITHOLOGIES_KEYS;
      x = xMi;
    }

    const fields = survey.reduce((acc, key) => {
      return fieldKeys.includes(key.name) ? [...acc, ...useForm.getChoicesByKey(survey, choices, key.name)] : acc;
    }, []);
    const labels = stratSection.column_profile === 'basic_lithologies' ? BASIC_LITHOLOGIES_LABELS
      : fields.map(f => f.label);

    if (stratSection.misc_labels) labels.splice(0, 3);      // Remove first 3 labels if misc

    const tickMarks = [];
    Array.from({length: labels.length}, (_, i) => {
      const tickMark = JSON.parse(JSON.stringify(lineString));
      tickMark.properties.label = labels[i];
      tickMark.geometry.coordinates = n === 1 ? [[x, 0], [x, -5]] : [[x, n * -s], [x, n * -s - 5]];
      tickMarks.push(useMaps.convertImagePixelsToLatLong(tickMark));
      x += xCl;
    });
    return turf.featureCollection(tickMarks);
  };

  return {
    getXAxis: getXAxis,
    getXAxisTickMarks: getXAxisTickMarks,
  };
};

export default useXAxis;
