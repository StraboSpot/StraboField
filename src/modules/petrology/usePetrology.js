import {useDispatch} from 'react-redux';

import {getNewId, isEmpty} from '../../shared/helpers';
import useForm from '../form/useForm';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const usePetrology = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {getSurvey, submitAndShowErrors} = useForm();

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

  const savePetFeature = async (key, spot, formCurrent, isLeavingPage) => {
    try {
      const {errors, values: editedFeatureData} = await submitAndShowErrors(formCurrent, isLeavingPage);
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
    activeTemplates.forEach(t => editedPetData[key].push({...t.values, id: getNewId()}));
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
