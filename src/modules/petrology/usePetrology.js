import {useDispatch} from 'react-redux';

import {getNewUUID, isEmpty} from '../../shared/helpers';
import useForm from '../form/useForm';
import {getDefaultLabel, resolveLabelOnSave} from '../page/featureLabels.helpers';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const usePetrology = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {getLabel, getLabels, getSurvey, submitAndShowErrors} = useForm();

  /* Exported Functions */

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

  const savePetFeature = async (key, spot, formCurrent, isLeavingPage, previousFeature) => {
    try {
      const {errors, values} = await submitAndShowErrors(formCurrent, isLeavingPage);
      const editedFeatureData = await resolveLabelOnSave(
        {pageKey: key, previousFeature: previousFeature, values: values, getLabel: getLabel, getLabels: getLabels});
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
        const i = editedPetData[key].findIndex(type => type.id === editedFeatureData.id);
        if (i === -1) editedPetData[key].push(editedFeatureData);
        else editedPetData[key].splice(i, 1, editedFeatureData);
        dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
        dispatch(editedSpotProperties({field: 'pet', value: editedPetData, spotId: spotId}));
      }
      // await formCurrent.resetForm();
      // Reported up so the caller can tell a full save from a partial one
      return errors;
    }
    catch (err) {
      console.error('Error saving', key, err);
      throw err;
    }
  };

  const savePetFeatureValuesFromTemplates = (key, spot, activeTemplates) => {
    let editedPetData = spot.properties.pet ? JSON.parse(JSON.stringify(spot.properties.pet)) : {};
    if (!editedPetData[key] || !Array.isArray(editedPetData[key])) editedPetData[key] = [];
    activeTemplates.forEach((t) => {
      const feature = {...t.values, id: getNewUUID()};
      feature.label = getDefaultLabel(key, feature, getLabel, getLabels);
      editedPetData[key].push(feature);
    });
    console.log('editedPetData', editedPetData);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'pet', value: editedPetData}));
  };

  return {
    deletePetFeature,
    savePetFeature,
    savePetFeatureValuesFromTemplates,
  };
};

export default usePetrology;
