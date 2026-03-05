import {isEmpty} from '../../shared/Helpers';

export const filterTagsByTagType = (tags, tagType) => {
  if (isEmpty(tagType)) return tags;
  return tags.filter(tag => tag.type.toUpperCase().startsWith(tagType.toUpperCase()));
};

export const getFeatureLabel = (feature) => {
  return feature && (feature.label || feature.name_of_experiment || 'Unknown Name');
};

export const getTagTitle = tag => tag.name || '';

export const tagSpotExists = (tag, spot) => {
  if (isEmpty(tag.spots)) return false;
  const i = tag.spots.indexOf(spot.properties.id);
  return i !== -1;
};
