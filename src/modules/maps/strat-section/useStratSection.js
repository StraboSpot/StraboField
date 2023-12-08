import * as turf from '@turf/turf';

import useStratSectionCalculationsHook from './useStratSectionCalculations';
import {isEmpty} from '../../../shared/Helpers';
import {useFormHook} from '../../form';
import {useSpotsHook} from '../../spots';

const useStratSection = () => {
  const [useForm] = useFormHook();
  const [useSpots] = useSpotsHook();
  const useStratSectionCalculations = useStratSectionCalculationsHook();

  // Create a new strat section interval, separating the fields to their respective objects
  const createInterval = (stratSectionId, data) => {
    let geojsonObj = {};
    geojsonObj.properties = {
      'strat_section_id': stratSectionId,
      'surface_feature': {'surface_feature_type': 'strat_interval'},
      'sed': {},
    };
    if (data.interval_type) geojsonObj.properties.sed.character = data.interval_type;

    // Interval fields in Add Interval
    const intervalSurvey = useForm.getSurvey(['sed', 'interval']);
    const intervalFieldNames = intervalSurvey.map(f => f.name);
    const intervalFieldNamesFiltered = intervalFieldNames.filter(n => n !== 'interval_type');
    const intervalFields = intervalFieldNamesFiltered.reduce((acc, name) => {
      if (data?.[name]) acc[name] = data[name];
      return acc;
    }, {});
    if (!isEmpty(intervalFields)) geojsonObj.properties.sed.interval = intervalFields;

    // Bedding fields in Add Interval
    const beddingSurvey = useForm.getSurvey(['sed', 'bedding']);
    const beddingFieldNames = beddingSurvey.map(f => f.name);
    let beddingFields = [];
    Object.entries(data).map(([key, value]) => {
      if (key.slice(-2) !== '_1' && beddingFieldNames.includes(key)) {
        if (!beddingFields[0]) beddingFields.push({});
        beddingFields[0][key] = value;
      }
      else if (key.slice(-2) === '_1' && beddingFieldNames.includes(key.slice(0, -2))) {
        if (!beddingFields[0]) beddingFields.push({});
        if (!beddingFields[1]) beddingFields.push({});
        beddingFields[1][key.slice(0, -2)] = value;
      }
    });
    if (!isEmpty(beddingFields)) geojsonObj.properties.sed.bedding = {'beds': beddingFields};

    const beddingSharedSurvey = data.interval_type === 'interbedded' || data.interval_type === 'bed_mixed_lit'
      ? useForm.getSurvey(['sed', 'bedding_shared_interbedded'])
      : useForm.getSurvey(['sed', 'bedding_shared_package']);
    const beddingSharedFieldNames = beddingSharedSurvey.map(f => f.name);
    let beddingSharedFields = beddingSharedFieldNames.reduce((acc, name) => {
      if (data?.[name]) acc[name] = data[name];
      return acc;
    }, {});
    if (!isEmpty(beddingSharedFields)) {
      if (!geojsonObj.properties.sed.bedding) geojsonObj.properties.sed.bedding = {};
      geojsonObj.properties.sed.bedding = {...geojsonObj.properties.sed.bedding, ...beddingSharedFields};
    }

    // Lithology fields in Add Interval (only fields from Lithology & Texture needed)
    const lithologiesLithologySurvey = useForm.getSurvey(['sed', 'lithology']);
    const lithologiesTextureSurvey = useForm.getSurvey(['sed', 'texture']);
    const lithologiesLithologyFieldNames = lithologiesLithologySurvey.map(f => f.name);
    const lithologiesTextureFieldNames = lithologiesTextureSurvey.map(f => f.name);
    const lithologiesFieldNames = [...lithologiesLithologyFieldNames, ...lithologiesTextureFieldNames];
    let lithologiesFields = [];
    Object.entries(data).map(([key, value]) => {
      if (key.slice(-2) !== '_1' && lithologiesFieldNames.includes(key)) {
        if (!lithologiesFields[0]) lithologiesFields.push({});
        lithologiesFields[0][key] = value;
      }
      else if (key.slice(-2) === '_1' && lithologiesFieldNames.includes(key.slice(0, -2))) {
        if (!lithologiesFields[0]) lithologiesFields.push({});
        if (!lithologiesFields[1]) lithologiesFields.push({});
        lithologiesFields[1][key.slice(0, -2)] = value;
      }
    });
    if (!isEmpty(lithologiesFields)) geojsonObj.properties.sed.lithologies = lithologiesFields;

    geojsonObj.geometry = useStratSectionCalculations.calculateIntervalGeometry(stratSectionId,
      geojsonObj.properties.sed);
    return geojsonObj;
  };

  // Move intervals and Spots in column down to close gap after target interval deleted
  const deleteInterval = (targetInterval) => {
    const targetIntervalExtent = turf.bbox(targetInterval);
    const targetIntervalHeight = targetIntervalExtent[3] - targetIntervalExtent[1];
    useStratSectionCalculations.moveSpotsUpOrDownByPixels(targetInterval.properties.strat_section_id,
      targetIntervalExtent[3], -targetIntervalHeight, targetInterval.properties.id);
    useSpots.deleteSpot(targetInterval.properties.id);
  };

  const getStratSectionSettings = (stratSectionId) => {
    const spot = useSpots.getSpotWithThisStratSection(stratSectionId);
    return spot && spot.properties && spot.properties.sed
    && spot.properties.sed.strat_section ? spot.properties.sed.strat_section : undefined;
  };

  const orderStratSectionIntervals = (intervals) => {
    const orderedIntervals = [];
    intervals.forEach((interval) => {
      let i = 0;
      while (i <= orderedIntervals.length) {
        if (i === orderedIntervals.length) {
          orderedIntervals.push(interval);
          break;
        }
        else {
          const newExtent = turf.bbox(interval);
          const curExtent = turf.bbox(orderedIntervals[i]);
          if (newExtent[3] >= curExtent[3]) {
            orderedIntervals.splice(i, 0, interval);
            break;
          }
          const nextExtent = turf.bbox(orderedIntervals[i]);
          if (newExtent[3] < curExtent[3] && newExtent[3] >= nextExtent[3]) {
            orderedIntervals.splice(i, 0, interval);
            break;
          }
        }
        i++;
      }
    });
    return orderedIntervals;
  };

  return {
    createInterval: createInterval,
    deleteInterval: deleteInterval,
    getStratSectionSettings: getStratSectionSettings,
    orderStratSectionIntervals: orderStratSectionIntervals,
  };
};

export default useStratSection;
