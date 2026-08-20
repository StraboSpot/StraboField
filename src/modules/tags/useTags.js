import React from 'react';
import {Text} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {TAG_FORM_NAMES, TAG_TYPES} from './tags.constants';
import {filterTagsByTagType, getFeatureLabel, tagSpotExists} from './tags.helpers';
import {deepFindFeatureById, isEmpty} from '../../shared/helpers';
import {useForm} from '../form';
import MeasurementLabel from '../measurements/MeasurementLabel';
import OtherFeatureLabel from '../other-features/OtherFeatureLabel';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import {
  addedSpotToTags,
  addedTagToSelectedSpot,
  deletedTagIdFromReports,
  setSelectedTag,
  updatedProject,
} from '../project/projects.slice';
import {setSelectedAttributes} from '../spots/spots.slice';
import ThreeDStructureLabel from '../three-d-structures/ThreeDStructureLabel';

const useTags = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedFeaturesForTagging = useSelector(state => state.spot.selectedAttributes) || [];
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);
  const tags = useSelector(state => state.project.project?.tags) || [];

  const {getLabel} = useForm();

  /* Internal Functions */

  // Attach or detach one tag across every selected feature of a Spot.
  const addRemoveSpotFeaturesFromTag = (tag, features, spotId, isAlreadyChecked) => {
    if (!tag.features) tag.features = {};
    let featureTagsForSpot = tag.features[spotId] || [];
    features.map((feature) => {
      const index = featureTagsForSpot.findIndex(id => id === feature.id);
      if (isAlreadyChecked) { // Already checked means the action is uncheck, so remove the tag from every feature
        if (index !== -1) featureTagsForSpot.splice(index, 1);
      }
      else { // Not checked means the action is check, so add the tag to every feature
        const featureData = feature.id;
        if (index === -1) featureTagsForSpot.push(featureData);
      }
    });
    tag.features[spotId] = featureTagsForSpot;
    saveTag(tag);
  };

  const getFeature = (spotId, featureId) => {
    const spot = spots[spotId];
    if (!isEmpty(spot) && !isEmpty(spot.properties)) {
      let foundFeature = deepFindFeatureById(spot.properties, featureId);
      return JSON.parse(JSON.stringify(foundFeature));
    }
  };

  const getFeatureTagsAtSpot = (featuresAtSpot) => {
    if (isEmpty(selectedSpot)) return [];
    let spotId = selectedSpot.properties.id;
    const featureIdSet = new Set(featuresAtSpot.map(feature => feature.id));
    return tags.filter(tag => tag.features && !isEmpty(tag.features[spotId])
      && tag.features[spotId].some(featureId => featureIdSet.has(featureId)));
  };

  /* Exported Functions */

  // Attach or detach one tag on a single feature of a Spot.
  const addRemoveSpotFeatureFromTag = (tag, feature, spotId) => {
    const featureData = feature.id;
    if (!tag.features) tag.features = {};
    if (isEmpty(tag.features[spotId])) tag.features[spotId] = [featureData];
    else {
      let featureTagsForSpot = tag.features[spotId];
      const index = featureTagsForSpot.findIndex(id => id === feature.id);
      if (index === -1) featureTagsForSpot.push(featureData);
      else featureTagsForSpot.splice(index, 1);
    }
    saveTag(tag);
  };

  const addRemoveSpotFromTag = (spotId, tag) => {
    const updatedSpots = tag.spots?.includes(spotId) ? tag.spots.filter(id => id !== spotId)
      : [...(tag.spots ?? []), spotId];
    saveTag({...tag, spots: updatedSpots});
  };

  // Entry point for the tag modal: routes to Spot-level, single-feature, or multi-feature tagging.
  const addRemoveTag = (tag, spot, isFeatureLevelTagging, isAlreadyChecked) => {
    const spotId = spot ? spot.properties.id : selectedSpot.properties.id;
    if (!isFeatureLevelTagging) addRemoveSpotFromTag(spotId, tag);
    else if (!isMultipleFeaturesTaggingEnabled) addRemoveSpotFeatureFromTag(tag, selectedFeaturesForTagging[0], spotId);
    else addRemoveSpotFeaturesFromTag(tag, selectedFeaturesForTagging, spotId, isAlreadyChecked);
  };

  const addSpotsToTags = (tagsList, spotsList) => {
    let tagsToUpdate = [];
    tagsList.map((tag) => {
      let spotsListForTagging = [];
      spotsList.map((spot) => {
        if (!tagSpotExists(tag, spot)) spotsListForTagging.push(spot.properties.id);
      });
      let tagCopy = JSON.parse(JSON.stringify(tag));
      tagCopy.spots = isEmpty(tagCopy.spots) ? spotsListForTagging : tagCopy.spots.concat(spotsListForTagging);
      tagsToUpdate.push(tagCopy);
    });
    saveTag(tagsToUpdate);
  };

  const addSpotToTags = (spotId, tagIds) => {
    dispatch(addedSpotToTags({spotId: spotId, tagIds: tagIds}));
  };

  const addTag = () => {
    dispatch(setSelectedTag({}));
    if (modalVisible === MODAL_KEYS.NOTEBOOK.TAGS) dispatch(addedTagToSelectedSpot(true));
    else dispatch(addedTagToSelectedSpot(false));
  };

  const deleteFeatureTags = (features) => {
    if (features.length === 0) return;
    let tagsToUpdate = [];
    let featureIds = features.map(feature => feature.id);
    tags.map((tag) => {
      let allOtherFeatureIds = [];
      let copyTag = JSON.parse(JSON.stringify(tag));
      if (selectedSpot && copyTag && copyTag.features
        && copyTag.features[selectedSpot.properties.id]) {
        allOtherFeatureIds = copyTag.features[selectedSpot.properties.id].filter(
          featureId => !featureIds.includes(featureId));
        copyTag.features[selectedSpot.properties.id] = allOtherFeatureIds;
        if (isEmpty(copyTag.features[selectedSpot.properties.id])) delete copyTag.features[selectedSpot.properties.id];
        if (isEmpty(copyTag.features)) delete copyTag.features;
        tagsToUpdate.push(copyTag);
      }
    });
    saveTag(tagsToUpdate);
  };

  const deleteTag = (tagToDelete) => {
    let updatedTags = tags.filter(tag => tag.id !== tagToDelete.id);
    dispatch(deletedTagIdFromReports(tagToDelete.id));
    dispatch(updatedProject({field: 'tags', value: updatedTags}));
    dispatch(setSelectedTag({}));
  };

  // Every feature the tag is attached to, across all Spots.
  const getAllTaggedFeatures = (tag) => {
    if (isEmpty(tag)) return [];
    let allTaggedFeatures = [];
    const spotFeatures = tag.features;
    if (isEmpty(spotFeatures)) return [];
    for (const [spotId, features] of Object.entries(spotFeatures)) {
      features.forEach((featureId) => {
        const feature = getFeature(spotId, featureId);
        if (feature) {
          feature.parentSpotId = spotId;
          feature.label = getFeatureLabel(feature);
          allTaggedFeatures.push(feature);
        }
        else console.log('Where did the feature', featureId, 'go in Spot', spotId, '?');
      });
    }
    return allTaggedFeatures;
  };

  const getFeatureDisplayComponent = (featureType, spotFeature) => {
    switch (featureType) {
      case PAGE_KEYS.MEASUREMENTS:
        return <MeasurementLabel item={spotFeature}/>;
      case PAGE_KEYS.THREE_D_STRUCTURES:
        return <ThreeDStructureLabel item={spotFeature}/>;
      case PAGE_KEYS.OTHER_FEATURES:
        return <OtherFeatureLabel item={spotFeature}/>;
      default:
        return <Text>{spotFeature.label}</Text>;
    }
  };

  const getGeologicUnitFeatureTagsAtSpot = (featuresAtSpot) => {
    const featureTagsAtSpot = getFeatureTagsAtSpot(featuresAtSpot);
    return featureTagsAtSpot.filter(tag => tag.type === TAG_TYPES.GEOLOGIC_UNIT);
  };

  const getGeologicUnitTagsAtSpot = (spotId) => {
    const tagsAtSpot = getTagsAtSpot(spotId);
    return tagsAtSpot.filter(tag => tag.type === TAG_TYPES.GEOLOGIC_UNIT);
  };

  const getNonGeologicUnitFeatureTagsAtSpot = (featuresAtSpot) => {
    const featureTagsAtSpot = getFeatureTagsAtSpot(featuresAtSpot);
    return featureTagsAtSpot.filter(tag => tag.type !== TAG_TYPES.GEOLOGIC_UNIT);
  };

  const getNonGeologicUnitTagsAtSpot = (spotId) => {
    const tagsAtSpot = getTagsAtSpot(spotId);
    return tagsAtSpot.filter(tag => tag.type !== TAG_TYPES.GEOLOGIC_UNIT);
  };

  const getSamplesWithThisTag = (tag) => {
    return isEmpty(tag.spots) ? []
      : tag.spots.filter((spotId) => {
        const spot = spots[spotId];
        if (!spot) return false;
        if (spot.properties?.isSample) return true;
        return spot.properties?.samples?.some(s => !spots[s.id]);
      });
  };

  const getSpotsWithThisTagCount = (tag) => {
    const validSpots = isEmpty(tag.spots) ? []
      : tag.spots.filter(spotId => spots[spotId] && !spots[spotId].properties?.isSample);
    return validSpots.length;
  };

  const getTagFeaturesCount = (tag) => {
    const validSpots = isEmpty(tag.features) ? [] : Object.keys(tag.features).filter(spotIds => spots[spotIds]);
    return validSpots.reduce((acc, spotId) => acc + tag.features[spotId].length, 0);
  };

  const getTagLabel = (key) => {
    const formName = key && key === PAGE_KEYS.GEOLOGIC_UNITS ? TAG_FORM_NAMES.GEOLOGIC_UNIT : TAG_FORM_NAMES.TAGS;
    if (key) return getLabel(key, formName);
    return 'No Type Specified';
  };

  // The tags attached to one feature of a Spot.
  const getTagsAtFeature = (spotId, featureId) => {
    if (!spotId && !isEmpty(selectedSpot)) spotId = selectedSpot.properties.id;
    let tagsAtFeature = tags.filter(
      tag => tag.features && tag.features[spotId] && tag.features[spotId].includes(featureId));
    if (!isEmpty(tagsAtFeature)) return tagsAtFeature;
    else return [];
  };

  // The tags attached to the Spot itself; defaults to the selected Spot.
  const getTagsAtSpot = (spotId) => {
    if (!spotId && !isEmpty(selectedSpot)) spotId = selectedSpot.properties.id;
    return tags.filter(tag => tag.spots && tag.spots.includes(spotId));
  };

  const getTagSpotsCount = (tag) => {
    const validSpots = isEmpty(tag.spots) ? [] : tag.spots.filter(spotIds => spots[spotIds]);
    return validSpots.length;
  };

  const saveTag = (tagToSave) => {
    let updatedTags;
    if (!Array.isArray(tagToSave)) {
      updatedTags = tags.filter(tag => tag.id !== tagToSave.id);
      updatedTags.push(tagToSave);
    }
    else {
      const tagIdsToSave = new Set(tagToSave.map(tag => tag.id));
      updatedTags = tags.filter(tag => !tagIdsToSave.has(tag.id));
      updatedTags = tagToSave.concat(updatedTags);
    }
    updatedTags = updatedTags.sort((tagA, tagB) => tagA.name.localeCompare(tagB.name));
    dispatch(updatedProject({field: 'tags', value: updatedTags}));
  };

  const setFeaturesSelectedForMultiTagging = (feature) => {
    const index = selectedFeaturesForTagging.findIndex(obj => obj.id === feature.id);
    if (index === -1) {
      dispatch(setSelectedAttributes([...selectedFeaturesForTagging, feature]));
      return true;
    }
    else {
      dispatch(setSelectedAttributes(selectedFeaturesForTagging.filter(obj => obj.id !== feature.id)));
      return false;
    }
  };

  const toggleContinuousTagging = (tag) => {
    saveTag({...tag, continuousTagging: !tag.continuousTagging});
  };

  return {
    addRemoveSpotFeatureFromTag,
    addRemoveSpotFromTag,
    addRemoveTag,
    addSpotsToTags,
    addSpotToTags,
    addTag,
    deleteFeatureTags,
    deleteTag,
    filterTagsByTagType,
    getAllTaggedFeatures,
    getFeatureDisplayComponent,
    getGeologicUnitFeatureTagsAtSpot,
    getGeologicUnitTagsAtSpot,
    getNonGeologicUnitFeatureTagsAtSpot,
    getNonGeologicUnitTagsAtSpot,
    getSamplesWithThisTag,
    getSpotsWithThisTagCount,
    getTagFeaturesCount,
    getTagLabel,
    getTagsAtFeature,
    getTagsAtSpot,
    getTagSpotsCount,
    saveTag,
    setFeaturesSelectedForMultiTagging,
    tagSpotExists,
    toggleContinuousTagging,
  };
};

export default useTags;
