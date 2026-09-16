import {PAGE_KEYS} from '../../modules/page/pageKeys.constants';
import {getTemplateKeys, getTemplateList, setTemplateList} from '../../modules/templates/templates.helpers';

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
// Built through setTemplateList so a backup file keeps the shape of the templates it came from.
export const getTemplatesToBackup = (templates) => {
  return getTemplateKeys(templates).reduce((acc, key) => {
    const templatesForKey = getTemplateList(templates, key);
    if (Array.isArray(templatesForKey)) setTemplateList(acc, key, templatesForKey);
    return acc;
  }, {});
};
