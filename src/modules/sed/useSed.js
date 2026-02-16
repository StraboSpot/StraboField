import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import {
  INTERPRETATIONS_SUBPAGES,
  LITHOLOGY_SUBPAGES,
  ROCK_SECOND_ORDER_TYPE_FIELDS,
  STRUCTURE_SUBPAGES,
} from './sed.constants';
import useSedValidation from './useSedValidation';
import {getNewId, getNewUUID, isEmpty, roundToDecimalPlaces, toTitleCase} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import {useForm} from '../form';
import {setStratSection} from '../maps/maps.slice';
import useStratSectionCalculations from '../maps/strat-section/useStratSectionCalculations';
import {PAGE_KEYS} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {useSpots} from '../spots';
import {editedOrCreatedSpot, editedSpotProperties} from '../spots/spots.slice';

const yMultiplier = 20;  // 1 m interval thickness = 20 pixels

const useSed = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const stratSection = useSelector(state => state.map.stratSection);

  const {getLabel, getLabels, showErrors} = useForm();
  const {validateSedData} = useSedValidation();
  const {getSpotWithThisStratSection, getSpotsMappedOnGivenStratSection, isStratInterval} = useSpots();
  const {moveSpotsUpOrDownByPixels, recalculateIntervalGeometry} = useStratSectionCalculations();

  /* Internal Functions */

  // Check for any changes we need to make to the Sed fields or geometry when a Spot that is a strat interval
  // has fields that are changed
  const checkForIntervalUpdates = (pageKey, spot, savedSpot) => {
    let extent;
    let needToRecalculateIntervalGeometry = false;      // Do we need to recalculate the geometry for the interval?
    if (spot.geometry && spot.properties.sed && savedSpot.properties.sed) {
      const sedData = spot.properties.sed;
      const sedDataSaved = savedSpot.properties.sed;

      // Current pageKey is spot tab
      if (pageKey === PAGE_KEYS.OVERVIEW) {
        // Calculate interval thickness if Spot has geometry and the surface feature type changed to strat interval
        if (!savedSpot.properties.surface_feature || !savedSpot.properties.surface_feature.surface_feature_type
          || savedSpot.properties.surface_feature.surface_feature_type !== 'strat_interval') {
          if (spot.geometry) {
            if (!spot.properties.sed) spot.properties.sed = {};
            if (!spot.properties.sed.interval) spot.properties.sed.interval = {};
            // console.log('Updating interval thickness ...');
            extent = turf.bbox(spot);
            let thickness = (extent[3] - extent[1]) / yMultiplier; // 20 is yMultiplier
            thickness = roundToDecimalPlaces(thickness, 2);
            spot.properties.sed.interval.interval_thickness = thickness;
            const spotWithThisStratSection = getSpotWithThisStratSection(spot.properties.strat_section_id);
            if (spotWithThisStratSection.properties && spotWithThisStratSection.properties.sed
              && spotWithThisStratSection.properties.sed.strat_section) {
              spot.properties.sed.interval.thickness_units
                = spotWithThisStratSection.properties.sed.strat_section.column_y_axis_units;
            }
            if (!spot.properties.sed.character) spot.properties.sed.character = 'unexposed_cove';
          }
        }
      }

        // Check for changes to certain fields which would require recalculation of the interval geometry
      // If current page is sed-interval
      else if (pageKey === PAGE_KEYS.INTERVAL) {
        const intervalFields = ['character', 'interval_thickness', 'thickness_units'];
        needToRecalculateIntervalGeometry = intervalFields.find((field) => {
          if (field === 'character') {
            if ((sedData[field] && !sedDataSaved[field]) || (!sedData[field] && !sedDataSaved[field])) return true;
            return ((sedData[field] === 'bed' || sedData[field] === 'package_succe')
                && !(sedDataSaved[field] === 'bed' || sedDataSaved[field] === 'package_succe'))
              || ((sedData[field] === 'unexposed_cove' || sedData[field] === 'not_measured')
                && !(sedDataSaved[field] === 'unexposed_cove' || sedDataSaved[field] === 'not_measured'))
              || ((sedData[field] === 'interbedded' || sedData[field] === 'bed_mixed_lit')
                && !(sedDataSaved[field] === 'interbedded' || sedDataSaved[field] === 'bed_mixed_lit'));
          }
          if (sedData.interval && sedDataSaved.interval && ((sedData.interval[field] && !sedDataSaved.interval[field])
            || (!sedData.interval[field] && sedDataSaved.interval[field]))) return true;
          return sedData.interval && sedDataSaved.interval && sedData.interval[field] && sedDataSaved.interval[field]
            && sedData.interval[field] !== sedDataSaved.interval[field];
        });
      }

      // If current page is sed-lithologies
      else if (pageKey === PAGE_KEYS.LITHOLOGIES) {
        const lithologiesFields = ['primary_lithology', 'siliciclastic_type', 'mud_silt_grain_size', 'sand_grain_size',
          'congl_grain_size', 'breccia_grain_size', 'dunham_classification', 'relative_resistance_weather'];
        needToRecalculateIntervalGeometry = lithologiesFields.find((field) => {
          if ((sedData.lithologies && !sedDataSaved.lithologies)
            || (!sedData.lithologies && sedDataSaved.lithologies)) return true;
          if (sedData.lithologies && sedDataSaved.lithologies
            && ((sedData.lithologies[0] && !sedDataSaved.lithologies[0])
              || (!sedData.lithologies[0] && sedDataSaved.lithologies[0]))) return true;
          if (sedData.lithologies && sedDataSaved.lithologies && sedData.lithologies[0] && sedDataSaved.lithologies[0]
            && sedData.lithologies[0][field] && sedDataSaved.lithologies[0][field]
            && sedData.lithologies[0][field] !== sedDataSaved.lithologies[0][field]) return true;
          if (sedData.lithologies && sedDataSaved.lithologies
            && ((sedData.lithologies[1] && !sedDataSaved.lithologies[1])
              || (!sedData.lithologies[1] && sedDataSaved.lithologies[1]))) return true;
          return sedData.lithologies && sedDataSaved.lithologies
            && sedData.lithologies[1] && sedDataSaved.lithologies[1]
            && sedData.lithologies[1][field] && sedDataSaved.lithologies[1][field]
            && sedData.lithologies[1][field] !== sedDataSaved.lithologies[1][field];
        });
      }
      // If current page is sed-bedding
      else if (pageKey === PAGE_KEYS.BEDDING) {
        const beddingFields = ['interbed_proportion_change', 'interbed_proportion', 'lithology_at_bottom_contact',
          'lithology_at_top_contact', 'thickness_of_individual_beds', 'avg_thickness', 'max_thickness',
          'min_thickness'];
        needToRecalculateIntervalGeometry = beddingFields.find((field) => {
          if ((sedData.bedding && !sedDataSaved.bedding) || (!sedData.bedding && sedDataSaved.bedding)) return true;
          if (sedData.bedding && sedDataSaved.bedding && ((sedData.bedding[field] && !sedDataSaved.bedding[field])
            || (!sedData.bedding[field] && sedDataSaved.bedding[field]))) return true;
          if (field !== 'avg_thickness' && field !== 'max_thickness' && field !== 'min_thickness') {
            return sedData.bedding && sedDataSaved.bedding && sedData.bedding[field] && sedDataSaved.bedding[field]
              && sedData.bedding[field] !== sedDataSaved.bedding[field];
          }
          if ((sedData.bedding.beds && !sedDataSaved.bedding.beds)
            || (!sedData.bedding.beds && sedDataSaved.bedding.beds)) return true;
          if (sedData.bedding.beds && sedDataSaved.bedding.beds
            && ((sedData.bedding.beds[0] && !sedDataSaved.bedding.beds[0])
              || (!sedData.bedding.beds[0] && sedDataSaved.bedding.beds[0]))) return true;
          if (sedData.bedding.beds && sedDataSaved.bedding.beds
            && sedData.bedding.beds[0] && sedDataSaved.bedding.beds[0]
            && sedData.bedding.beds[0][field] && sedDataSaved.bedding.beds[0][field]
            && sedData.bedding.beds[0][field] !== sedDataSaved.bedding.beds[0][field]) return true;
          if (sedData.bedding.beds && sedDataSaved.bedding.beds
            && ((sedData.bedding.beds[1] && !sedDataSaved.bedding.beds[1])
              || (!sedData.bedding.beds[1] && sedDataSaved.bedding.beds[1]))) return true;
          return sedData.bedding.beds && sedDataSaved.bedding.beds
            && sedData.bedding.beds[1] && sedDataSaved.bedding.beds[1]
            && sedData.bedding.beds[1][field] && sedDataSaved.bedding.beds[1][field]
            && sedData.bedding.beds[1][field] !== sedDataSaved.bedding.beds[1][field];
        });
      }
      if (needToRecalculateIntervalGeometry) {
        spot = recalculateIntervalGeometry(spot);
        // Move above intervals up or down if interval thickness changed
        if (sedData.interval && sedData.interval.interval_thickness && sedDataSaved.interval
          && sedDataSaved.interval.interval_thickness) {
          const targetIntervalExtent = turf.bbox(spot); //bbox extent in minX, minY, maxX, maxY order
          const savedSpotIntervalExtent = turf.bbox(savedSpot);
          const diff = targetIntervalExtent[3] - savedSpotIntervalExtent[3];
          // Move above spots up
          if (sedData.interval.interval_thickness > sedDataSaved.interval.interval_thickness) {
            moveSpotsUpOrDownByPixels(spot.properties.strat_section_id, savedSpotIntervalExtent[3], diff,
              spot.properties.id);
          }
          // Move above spots down
          else if (sedData.interval.interval_thickness < sedDataSaved.interval.interval_thickness) {
            moveSpotsUpOrDownByPixels(spot.properties.strat_section_id, targetIntervalExtent[3], diff,
              spot.properties.id);
          }
        }
      }
    }
    return spot;
  };

  const createNewStratSection = (spot) => {
    let editedSedData = spot.properties.sed ? JSON.parse(JSON.stringify(spot.properties.sed)) : {};
    editedSedData.strat_section = {};
    editedSedData.strat_section.strat_section_id = getNewUUID();
    editedSedData.strat_section.column_profile = 'clastic';
    editedSedData.strat_section.column_y_axis_units = 'm';
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
  };

  const deleteStratSection = (spot) => {
    let editedSedData = spot.properties.sed ? JSON.parse(JSON.stringify(spot.properties.sed)) : {};
    delete editedSedData.strat_section;
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
  };

  /* Exported Functions */

  const deleteSedFeature = (key, spot, selectedFeature) => {
    let pageKey = key;
    if (Object.values(LITHOLOGY_SUBPAGES).includes(key)) pageKey = PAGE_KEYS.LITHOLOGIES;
    else if (Object.values(STRUCTURE_SUBPAGES).includes(key)) pageKey = PAGE_KEYS.STRUCTURES;
    else if (Object.values(INTERPRETATIONS_SUBPAGES).includes(key)) pageKey = PAGE_KEYS.INTERPRETATIONS;

    let editedSedData = spot.properties.sed ? JSON.parse(JSON.stringify(spot.properties.sed)) : {};
    if (!editedSedData[pageKey]) editedSedData[pageKey] = [];
    if (pageKey === PAGE_KEYS.STRAT_SECTION) {
      // ToDo Check if any spots mapped on this strat section before deleting
      // console.log('Delete not implemented yet.');
      alert('Notice', 'Unable to delete. This feature has not been implemented yet.');
    }
    else if (pageKey === PAGE_KEYS.BEDDING) {
      if (editedSedData[pageKey].beds) {
        editedSedData[pageKey].beds = editedSedData[pageKey].beds.filter(type => type.id !== selectedFeature.id);
      }
      if (isEmpty(editedSedData[pageKey].beds)) delete editedSedData[pageKey].beds;
      if (isEmpty(editedSedData[pageKey])) delete editedSedData[pageKey];
    }
    else {
      editedSedData[pageKey] = editedSedData[pageKey].filter(type => type.id !== selectedFeature.id);
      if (isEmpty(editedSedData[pageKey])) delete editedSedData[pageKey];
    }
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
  };

  const getBeddingTitle = (bedding) => {
    const formName = ['sed', 'bedding'];
    const fieldName = 'package_geometry';
    const choiceLabels = getLabels(bedding[fieldName], formName);
    if (isEmpty(choiceLabels)) return 'Unknown Bed';
    else return choiceLabels;
  };

  const getIntervalTitle = (character, interval) => {
    const formName = ['sed', 'interval'];
    return (interval.interval_thickness ? getLabel(interval.interval_thickness, formName) : 'Unknown Thickness')
      + (interval.thickness_units ? getLabel(interval.thickness_units, formName) : ' Unknown Units')
      + (character ? ' ' + getLabel(character, formName) : ' Unknown Character');
  };

  const getSedRockTitle = (rock) => {
    const formName = ['sed', 'lithologies'];
    const mainLabel = getLabel(rock.primary_lithology, formName);
    const labelsArr = ROCK_SECOND_ORDER_TYPE_FIELDS.reduce((acc, fieldName) => {
      if (rock[fieldName]) {
        const choiceLabel = getLabels(rock[fieldName], formName);
        return [...acc, choiceLabel.toUpperCase()];
      }
      else return acc;
    }, []);
    if (isEmpty(labelsArr)) return toTitleCase(mainLabel);
    else return toTitleCase(mainLabel) + ' - ' + labelsArr.join(', ');
  };

  const getStratSectionTitle = (inStratSection) => {
    const formName = ['sed', PAGE_KEYS.STRAT_SECTION];
    const columnProfile = inStratSection.column_profile ? getLabel(inStratSection.column_profile, formName)
      : 'Unknown Profile';
    const columnYUnits = inStratSection.column_y_axis_units
      ? getLabel(inStratSection.column_y_axis_units, formName) : 'Unknown Units';
    return (inStratSection.section_well_name || 'Unknown Section/Well Name') + ' - ' + columnProfile
      + ' (' + columnYUnits + ')';
  };

  const onSedFormChange = (formCurrent, name, value) => {
    // console.log(name, 'changed to', value);
    if (name === 'siliciclastic_type' && (value === 'claystone' || value === 'mudstone')) {
      formCurrent.setFieldValue('mud_silt_grain_size', 'clay');
    }
    else if (name === 'siliciclastic_type' && value === 'siltstone') {
      formCurrent.setFieldValue('mud_silt_grain_size', 'silt');
    }
    formCurrent.setFieldValue(name, value);
  };

  const saveSedBedFeature = async (key, spot, formCurrent, isLeavingPage) => {
    await saveSedFeature(key, spot, formCurrent, isLeavingPage, 'beds');
  };

  const saveSedFeature = async (key, spot, formCurrent, isLeavingPage, subKey) => {
    let pageKey = key;
    if (Object.values(LITHOLOGY_SUBPAGES).includes(key)) pageKey = PAGE_KEYS.LITHOLOGIES;
    else if (Object.values(STRUCTURE_SUBPAGES).includes(key)) pageKey = PAGE_KEYS.STRUCTURES;
    else if (Object.values(INTERPRETATIONS_SUBPAGES).includes(key)) pageKey = PAGE_KEYS.INTERPRETATIONS;

    try {
      await formCurrent.submitForm();
      let editedFeatureData = showErrors(formCurrent, isLeavingPage);
      let editedSpot = JSON.parse(JSON.stringify(spot));
      let editedSedData = editedSpot.properties.sed ? JSON.parse(JSON.stringify(editedSpot.properties.sed)) : {};
      if (subKey) {
        if (!editedSedData[pageKey]) editedSedData[pageKey] = {};
        if (!editedSedData[pageKey][subKey]) editedSedData[pageKey][subKey] = [];
        let i = editedSedData[pageKey][subKey].findIndex(b => b.id === editedFeatureData.id);
        if (i === -1) i = editedSedData[pageKey][subKey].length;
        editedSedData[pageKey][subKey].splice(i, 1, editedFeatureData);
      }
      else if (pageKey === PAGE_KEYS.BEDDING) editedSedData[pageKey] = editedFeatureData;
      else if (pageKey === PAGE_KEYS.INTERVAL) {
        const {character, ...intervalData} = editedFeatureData;
        if (character) editedSedData.character = character;
        else if (editedSedData.character) delete editedSedData.character;
        editedSedData.interval = intervalData;
      }
      else if (pageKey === PAGE_KEYS.STRAT_SECTION) {
        editedSedData[pageKey] = Object.entries(editedSedData[pageKey]).reduce((acc, [k, v]) => {
          return k === 'strat_section_id' || k === 'images' ? {...acc, [k]: v} : acc;
        }, {});
        editedSedData[pageKey] = {...editedSedData[pageKey], ...editedFeatureData};
      }
      else {
        if (!editedSedData[pageKey] || !Array.isArray(editedSedData[pageKey])) editedSedData[pageKey] = [];
        let i = editedSedData[pageKey].findIndex(b => b.id === editedFeatureData.id);
        if (i === -1) i = editedSedData[pageKey].length;
        editedSedData[pageKey].splice(i, 1, editedFeatureData);
      }

      // Validate more conditions for Sed
      validateSedData(editedSedData, editedSpot, pageKey);

      // Update geometry if Interval
      if (isStratInterval(spot)) {
        editedSpot.properties.sed = editedSedData;
        const updatedSpot = checkForIntervalUpdates(pageKey, editedSpot, spot);
        // console.log('Saving', pageKey, 'data to Spot ...');
        dispatch(updatedModifiedTimestampsBySpotsIds([updatedSpot.properties.id]));
        dispatch(editedOrCreatedSpot(updatedSpot));
      }
      // Update Sed data
      else {
        // console.log('Saving', pageKey, 'data to Spot ...');
        const spotId = spot.properties.id;
        dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
        dispatch(editedSpotProperties({field: 'sed', value: editedSedData, spotId: spotId}));
      }

      // Update strat section for map if matches edited strat section
      const stratSectionSettings = editedSedData.strat_section || {};
      if (stratSection?.strat_section_id && stratSection.strat_section_id === stratSectionSettings?.strat_section_id) {
        dispatch(setStratSection(stratSectionSettings));
      }
    }
    catch (err) {
      // console.log('Error saving', pageKey, err);
      throw Error;
    }
  };

  const saveSedFeatureValuesFromTemplates = (key, spot, activeTemplates) => {
    let editedSedData = spot.properties.sed ? JSON.parse(JSON.stringify(spot.properties.sed)) : {};
    if (!editedSedData[key] || !Array.isArray(editedSedData[key])) editedSedData[key] = [];
    activeTemplates.forEach(t => editedSedData[key].push({...t.values, id: getNewId()}));
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
  };

  const toggleStratSection = (spot) => {
    if (!spot.properties?.sed?.strat_section) createNewStratSection(spot);
    else {
      const spotsMappedOnThisStratSection = getSpotsMappedOnGivenStratSection(
        spot.properties.sed.strat_section.strat_section_id);
      if (spotsMappedOnThisStratSection.length > 0) {
        alert('Strat Section In Use', 'There are ' + spotsMappedOnThisStratSection.length
          + ' Spot(s) mapped on this Spot. Delete these Spots before removing the strat section.');
      }
      else {
        alert(
          'Delete Strat Section?',
          'Are you sure you want to delete this strat section?',
          [{
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          }, {
            text: 'OK',
            onPress: () => deleteStratSection(spot),
          }],
          {cancelable: false},
        );
      }
    }
  };

  return {
    deleteSedFeature,
    getBeddingTitle,
    getIntervalTitle,
    getSedRockTitle,
    getStratSectionTitle,
    onSedFormChange,
    saveSedBedFeature,
    saveSedFeature,
    saveSedFeatureValuesFromTemplates,
    toggleStratSection,
  };
};

export default useSed;
