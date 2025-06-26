import {useDispatch} from 'react-redux';

import {
  ABBREVIATIONS_WITH_LABELS,
  LABELS_WITH_ABBREVIATIONS,
  ROCK_FIRST_ORDER_CLASS_FIELDS,
} from './petrology.constants';
import {getNewId, isEmpty, toTitleCase} from '../../shared/Helpers';
import {useForm} from '../form';
import {PAGE_KEYS} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const usePetrology = () => {
  const dispatch = useDispatch();

  const {getLabel, getLabels, getSurvey, showErrors} = useForm();

  const deletePetFeature = (key, spot, selectedFeature) => {
    let editedPetData = spot.properties.pet ? JSON.parse(JSON.stringify(spot.properties.pet)) : {};

    // Delete SS1 style rock data of given type
    if (selectedFeature.rock_type) {
      const survey = getSurvey(['pet_deprecated', key]);
      survey.forEach(f => delete editedPetData[f.name]);
      editedPetData.rock_type = editedPetData.rock_type.filter(t => t !== key);
      if (isEmpty(editedPetData.rock_type)) delete editedPetData.rock_type;
    }
    else {
      if (!editedPetData[key]) editedPetData[key] = [];
      editedPetData[key] = editedPetData[key].filter(type => type.id !== selectedFeature.id);
      if (isEmpty(editedPetData[key])) delete editedPetData[key];
    }
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'pet', value: editedPetData}));
  };

  const getAbbrevFromFullMineralName = (name) => {
    const keyMatch = Object.keys(LABELS_WITH_ABBREVIATIONS).find(key => key.toLowerCase() === name.toLowerCase());
    if (keyMatch) return LABELS_WITH_ABBREVIATIONS[keyMatch].split(',')[0];
  };

  const getFullMineralNameFromAbbrev = (abbrev) => {
    return ABBREVIATIONS_WITH_LABELS[abbrev.toLowerCase()];
  };

  const getMineralTitle = (item) => {
    if (item.full_mineral_name && item.mineral_abbrev) return item.full_mineral_name + ' (' + item.mineral_abbrev + ')';
    else return item.full_mineral_name || '(' + item.mineral_abbrev + ')' || 'Unknown';
  };

  const getReactionTextureTitle = (item) => {
    const formName = ['pet', 'reactions'];
    return (item.reactions || 'Unknown')
      + (item.based_on && (' - ' + getLabels(item.based_on, formName).toUpperCase()));
  };

  const getPetRockTitle = (rock, type) => {
    const formName = type === 'igneous' ? ['pet', rock.igneous_rock_class] : ['pet', type];
    const labelsArr = ROCK_FIRST_ORDER_CLASS_FIELDS[type].reduce((acc, fieldName) => {
      if (rock[fieldName]) {
        const mainLabel = getLabel(fieldName, formName);
        const choiceLabels = getLabels(rock[fieldName], formName);
        return [...acc, toTitleCase(mainLabel) + ' - ' + choiceLabels.toUpperCase()];
      }
      else return acc;
    }, []);
    if (isEmpty(labelsArr)) {
      const defaultTitle = type === 'igneous' ? rock.igneous_rock_class
        : type === 'alteration_or' ? 'Alteration, Ore'
          : type;
      return toTitleCase(getLabel(defaultTitle + ' Rock', formName));
    }
    else return labelsArr.join(', ');
  };

  const onMineralChange = async (formCurrent, name, value) => {
    console.log(name, 'changed to', value);
    if (name === 'mineral_abbrev') {
      const foundFullName = getFullMineralNameFromAbbrev(value);
      if (foundFullName) await formCurrent.setFieldValue('full_mineral_name', foundFullName);
      await formCurrent.setFieldValue('mineral_abbrev', value);
    }
    else if (name === 'full_mineral_name') {
      const foundAbbrev = getAbbrevFromFullMineralName(value);
      if (foundAbbrev) await formCurrent.setFieldValue('mineral_abbrev', foundAbbrev);
      await formCurrent.setFieldValue('full_mineral_name', value);
    }
    else await formCurrent.setFieldValue(name, value);
  };

  const savePetFeature = async (key, spot, formCurrent, isLeavingPage) => {
    try {
      await formCurrent.submitForm();
      const editedFeatureData = showErrors(formCurrent, isLeavingPage);
      console.log('Saving', key, 'data to Spot ...');
      const spotId = spot.properties.id;
      if (editedFeatureData.rock_type && (key === PAGE_KEYS.ROCK_TYPE_IGNEOUS
        || key === PAGE_KEYS.ROCK_TYPE_METAMORPHIC || key === PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE)) {
        dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
        dispatch(editedSpotProperties({field: 'pet', value: editedFeatureData, spotId: spotId}));
      }
      else {
        let editedPetData = spot.properties.pet ? JSON.parse(JSON.stringify(spot.properties.pet)) : {};
        if (!editedPetData[key] || !Array.isArray(editedPetData[key])) editedPetData[key] = [];
        editedPetData[key] = editedPetData[key].filter(type => type.id !== editedFeatureData.id);
        editedPetData[key].push(editedFeatureData);
        dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
        dispatch(editedSpotProperties({field: 'pet', value: editedPetData, spotId: spotId}));
      }
      // await formCurrent.resetForm();
    }
    catch (err) {
      console.log('Error saving', key, err);
      throw Error;
    }
  };

  const savePetFeatureValuesFromTemplates = (key, spot, activeTemplates) => {
    let editedPetData = spot.properties.pet ? JSON.parse(JSON.stringify(spot.properties.pet)) : {};
    if (!editedPetData[key] || !Array.isArray(editedPetData[key])) editedPetData[key] = [];
    activeTemplates.forEach(t => editedPetData[key].push({...t.values, id: getNewId()}));
    console.log('editedPetData', editedPetData);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'pet', value: editedPetData}));
  };

  return {
    deletePetFeature: deletePetFeature,
    getMineralTitle: getMineralTitle,
    getReactionTextureTitle: getReactionTextureTitle,
    getPetRockTitle: getPetRockTitle,
    onMineralChange: onMineralChange,
    savePetFeature: savePetFeature,
    savePetFeatureValuesFromTemplates: savePetFeatureValuesFromTemplates,
  };
};

export default usePetrology;
