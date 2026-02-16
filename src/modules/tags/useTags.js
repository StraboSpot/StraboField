import React from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {tagsStyles} from './index';
import {TAG_ROCK_UNIT_FIELDS, TAG_SUBTYPE_FIELDS} from './tags.constants';
import {deepFindFeatureById, isEmpty, toTitleCase, truncateText} from '../../shared/Helpers';
import {useForm} from '../form';
import MeasurementLabel from '../measurements/MeasurementLabel';
import OtherFeatureLabel from '../other-features/OtherFeatureLabel';
import {MODAL_KEYS, PAGE_KEYS} from '../page/page.constants';
import {
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
  const projectTags = useSelector(state => state.project.project?.tags) || [];
  const selectedFeaturesForTagging = useSelector(state => state.spot.selectedAttributes);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const selectedTag = useSelector(state => state.project.selectedTag);
  const spots = useSelector(state => state.spot.spots);

  const {getLabel} = useForm();

  /* Internal Functions */

  // link unlink multiple tags and spot features.
  const addRemoveSpotFeaturesFromTag = (tag, features, spotId, isAlreadyChecked) => {
    if (!tag.features) tag.features = {};
    let featureTagsForSpot = tag.features[spotId] || [];
    features.map((feature) => {
      const index = featureTagsForSpot.findIndex(id => id === feature.id);
      if (isAlreadyChecked) { // if checked (action is uncheck), then remove from tag from all selected features
        if (index !== -1) featureTagsForSpot.splice(index, 1);
      }
      else { // if not checked (action is check), then add tag to all selected features.
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

  const getFeatureLabel = (feature) => {
    return feature && (feature.label || feature.name_of_experiment || 'Unknown Name');
  };

  const getFeatureTagsAtSpot = (featuresAtSpot) => {
    if (isEmpty(selectedSpot)) return [];
    let spotId = selectedSpot.properties.id;
    let featureIds = featuresAtSpot.map(feature => feature.id);
    return projectTags.filter(tag => tag.features && !isEmpty(tag.features[spotId])
      && tag.features[spotId].some(featureId => featureIds.includes(featureId)));
  };

  /* Exported Functions */

  // link unlink given tag and spot feature.
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
    let selectedTagCopy = JSON.parse(JSON.stringify(tag));
    if (selectedTagCopy.spots) {
      if (selectedTagCopy.spots.includes(spotId)) {
        selectedTagCopy.spots = selectedTagCopy.spots.filter(id => spotId !== id);
      }
      else selectedTagCopy.spots.push(spotId);
    }
    else {
      selectedTagCopy.spots = [];
      selectedTagCopy.spots.push(spotId);
    }
    saveTag(selectedTagCopy);
  };

  // tag modal - add remove tags (wrapper method for feature level tagging and spot level tagging).
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

  const addTag = () => {
    dispatch(setSelectedTag({}));
    if (modalVisible === MODAL_KEYS.NOTEBOOK.TAGS) dispatch(addedTagToSelectedSpot(true));
    else dispatch(addedTagToSelectedSpot(false));
  };

  const deleteFeatureTags = (features) => {
    if (features.length === 0) return;
    let tagsToUpdate = [];
    let featureIds = features.map(feature => feature.id);
    projectTags.map((tag) => {
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
    let updatedTags = projectTags.filter(tag => tag.id !== tagToDelete.id);
    dispatch(deletedTagIdFromReports(tagToDelete.id));
    dispatch(updatedProject({field: 'tags', value: updatedTags}));
    dispatch(setSelectedTag({}));
  };

  const filterTagsByTagType = (tags, tagType) => {
    if (isEmpty(tagType)) return tags;
    const tagsByTagsType = tags.filter(tag => tag.type.toUpperCase().startsWith(tagType.toUpperCase()));
    return tagsByTagsType;
  };

  // to display all features that are currently tagged to the provided tag
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
    return featureTagsAtSpot.filter(tag => tag.type === 'geologic_unit');
  };

  const getGeologicUnitTagsAtSpot = (spotId) => {
    const tagsAtSpot = getTagsAtSpot(spotId);
    return tagsAtSpot.filter(tag => tag.type === 'geologic_unit');
  };

  const getNonGeologicUnitFeatureTagsAtSpot = (featuresAtSpot) => {
    const featureTagsAtSpot = getFeatureTagsAtSpot(featuresAtSpot);
    return featureTagsAtSpot.filter(tag => tag.type !== 'geologic_unit');
  };

  const getNonGeologicUnitTagsAtSpot = (spotId) => {
    const tagsAtSpot = getTagsAtSpot(spotId);
    return tagsAtSpot.filter(tag => tag.type !== 'geologic_unit');
  };

  const getTagFeaturesCount = (tag) => {
    const validSpots = isEmpty(tag.features) ? [] : Object.keys(tag.features).filter(spotIds => spots[spotIds]);
    return validSpots.reduce((acc, spotId) => acc + tag.features[spotId].length, 0);
  };

  const getTagLabel = (key) => {
    const formName = key && key === PAGE_KEYS.GEOLOGIC_UNITS ? ['project', 'geologic_unit'] : ['project', 'tags'];
    if (key) return getLabel(key, formName);
    return 'No Type Specified';
  };

  // to display all tags at given feature.
  const getTagsAtFeature = (spotId, featureId) => {
    if (!spotId && !isEmpty(selectedSpot)) spotId = selectedSpot.properties.id;
    let tagsAtFeature = projectTags.filter(
      tag => tag.features && tag.features[spotId] && tag.features[spotId].includes(featureId));
    if (!isEmpty(tagsAtFeature)) return tagsAtFeature;
    else return [];
  };

  // Get Tags at a Spot given an ID or if no ID specified get tags at the selected Spot
  const getTagsAtSpot = (spotId) => {
    if (!spotId && !isEmpty(selectedSpot)) spotId = selectedSpot.properties.id;
    return projectTags.filter(tag => tag.spots && tag.spots.includes(spotId));
  };

  const getTagSpotsCount = (tag) => {
    const validSpots = isEmpty(tag.spots) ? [] : tag.spots.filter(spotIds => spots[spotIds]);
    return validSpots.length;
  };

  const renderTagInfo = () => {
    let type = selectedTag.type ? getTagLabel(selectedTag.type) : 'No type specified';
    if (selectedTag.type === 'other' && selectedTag.other_type) type = selectedTag.other_type;
    const subTypeField = TAG_SUBTYPE_FIELDS.find(subtype => selectedTag[subtype]);
    const subType = subTypeField ? getTagLabel(selectedTag[subTypeField]) : undefined;
    let rockUnitString = TAG_ROCK_UNIT_FIELDS.reduce((acc, field) => {
      if (selectedTag[field]) return acc + (!isEmpty(acc) ? ' / ' : '') + selectedTag[field];
      else return acc;
    }, []);
    const notes = selectedTag.notes ? truncateText(selectedTag.notes, 100) : undefined;
    return (
      <View style={tagsStyles.sectionContainer}>
        {<Text style={tagsStyles.listText}>{toTitleCase(type)}{subType && ' - ' + subType.toUpperCase()}</Text>}
        {!isEmpty(rockUnitString) && <Text style={tagsStyles.listText}>{rockUnitString}</Text>}
        {notes && <Text style={tagsStyles.listText}>Notes: {notes}</Text>}
      </View>
    );
  };

  const saveTag = (tagToSave) => {
    let updatedTags;
    if (!Array.isArray(tagToSave)) {
      updatedTags = projectTags.filter(tag => tag.id !== tagToSave.id);
      updatedTags.push(tagToSave);
    }
    else {
      let tagIdsToSave = tagToSave.map(tag => tag.id);
      updatedTags = projectTags.filter(tag => !tagIdsToSave.includes(tag.id));
      updatedTags = tagToSave.concat(updatedTags);
    }
    updatedTags = updatedTags.sort((tagA, tagB) => tagA.name.localeCompare(tagB.name));
    dispatch(updatedProject({field: 'tags', value: updatedTags}));
  };

  const setFeaturesSelectedForMultiTagging = (feature) => {
    let selectedFeaturesForTaggingCopy = JSON.parse(JSON.stringify(selectedFeaturesForTagging));
    let index = selectedFeaturesForTagging.findIndex(obj => obj.id === feature.id);
    if (index === -1) {
      selectedFeaturesForTaggingCopy.push(feature);
      dispatch(setSelectedAttributes(selectedFeaturesForTaggingCopy));
      return true;
    }
    else {
      selectedFeaturesForTaggingCopy.splice(index, 1);
      dispatch(setSelectedAttributes(selectedFeaturesForTaggingCopy));
      return false;
    }
  };

  const tagSpotExists = (tag, spot) => {
    if (isEmpty(tag.spots)) return false;
    const i = tag.spots.indexOf(spot.properties.id);
    return i !== -1;
  };

  const toggleContinuousTagging = (tag) => {
    let tagCopy = JSON.parse(JSON.stringify(tag));
    tagCopy.continuousTagging = !tag.continuousTagging;
    saveTag(tagCopy);
  };

  return {
    addRemoveSpotFeatureFromTag,
    addRemoveSpotFromTag,
    addRemoveTag,
    addSpotsToTags,
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
    getTagFeaturesCount,
    getTagLabel,
    getTagsAtFeature,
    getTagsAtSpot,
    getTagSpotsCount,
    renderTagInfo,
    saveTag,
    setFeaturesSelectedForMultiTagging,
    tagSpotExists,
    toggleContinuousTagging,
  };
};

export default useTags;
