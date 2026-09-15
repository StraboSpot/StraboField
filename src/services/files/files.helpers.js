import {PAGE_KEYS} from '../../modules/page/pageKeys.constants';

export const getImageIds = (images) => {
  const imageIds = [];
  images.forEach(image => imageIds.push(image.id));
  console.log(imageIds);
  return imageIds;
};

// Tags and geologic units share a store and are told apart by type. Spots and features are dropped because they
// reference this project's data and would not resolve in the project the backup is loaded into.
export const getTagsToBackup = (tags, isGeologicUnits) => {
  return (tags || []).reduce((acc, tag) => {
    const {spots, features, ...rest} = tag;
    return (isGeologicUnits && rest.type === PAGE_KEYS.GEOLOGIC_UNITS)
    || (!isGeologicUnits && rest.type !== PAGE_KEYS.GEOLOGIC_UNITS) ? [...acc, rest] : acc;
  }, []);
};

// Keeps only the template lists themselves — which templates are active is a per-project preference, not a template.
export const getTemplatesToBackup = (templates) => {
  return Object.entries(templates || {}).reduce((acc, [key, value]) => {
    if (key === 'activeMeasurementTemplates' || key === 'useMeasurementTemplates') return acc;
    if (key === 'measurementTemplates') return {...acc, measurementTemplates: value};
    if (value && typeof value === 'object' && Array.isArray(value.templates)) {
      return {...acc, [key]: {templates: value.templates}};
    }
    return acc;
  }, {});
};
