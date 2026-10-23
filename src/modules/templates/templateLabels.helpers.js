import {MEASUREMENT_TEMPLATE_KEY} from './templates.constants';
import {getTemplateKeys, getTemplateList} from './templates.helpers';
import forms from '../../assets/forms';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import {
  MEASUREMENT_GROUP_KEY,
  MEASUREMENT_KEYS,
  MEASUREMENT_TYPE_LABELS,
  MEASUREMENT_TYPES,
} from '../measurements/measurements.constants';
import {isPlanarType} from '../measurements/measurements.helpers';
import {NOTEBOOK_PAGES, PAGES_SECTIONS} from '../page/page.constants';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {IGNEOUS_SECTION_TITLES} from '../petrology/rocks/rocks.constants';

// What templates are called, taken from the constants that name what they are templates of. Kept apart from
// templates.helpers, which the project slice imports, as page.constants imports the notebook's pages.

const getPage = key => NOTEBOOK_PAGES.find(p => p.key === key);

// What a list of a key's templates is called: an igneous rock's by its class, the rest by their notebook page
const getTemplatesLabel = key => IGNEOUS_SECTION_TITLES[key] || getPage(key)?.label
  || toTitleCase(key.replaceAll('_', ' ').trim());

// What a template of a key or type is called: a measurement's by its orientation, the rest as their list is, in the
// singular
export const getTemplateTypeLabel = key => MEASUREMENT_TYPE_LABELS[key] || getPage(key)?.label_singular
  || getTemplatesLabel(key).replace(/s$/, '');

// What TemplatesPicker's list for a type is called. A planar measurement list takes in tabular templates, so it is
// named for planar ones.
export const getPickerTypeLabel = type => getTemplateTypeLabel(isPlanarType(type) ? MEASUREMENT_KEYS.PLANAR : type);

// The kinds of template that can be made, in sections for the main menu's list, each item a form key with its name
export const getNewTemplateSections = () => {
  const toItems = keys => keys.map(key => ({id: key, name: getTemplateTypeLabel(key)}));
  const rocksAndMineralsSection = PAGES_SECTIONS.find(s => s.pages.some(p => p.key === PAGE_KEYS.MINERALS));
  return [
    {
      groupKey: MEASUREMENT_GROUP_KEY,
      label: getTemplatesLabel(PAGE_KEYS.MEASUREMENTS),
      data: toItems(Object.keys(forms[MEASUREMENT_GROUP_KEY])),
    },
    {groupKey: PAGE_KEYS.NOTES, label: getTemplatesLabel(PAGE_KEYS.NOTES), data: toItems([PAGE_KEYS.NOTES])},
    {
      groupKey: 'pet',
      label: rocksAndMineralsSection.title,
      data: toItems(Object.keys(forms.pet).filter(key => key !== PAGE_KEYS.REACTIONS)),
    },
  ];
};

// The project's templates in sections for the main menu's list, keyed by template key and named as their lists are,
// each section and the templates in it sorted by name. Measurements are the one key whose templates are not all of
// a kind, so they get a section for each kind of measurement, tabular templates taking their place with planar ones.
export const getSavedTemplateSections = (templates) => {
  const sections = getTemplateKeys(templates).flatMap((key) => {
    const templatesForKey = getTemplateList(templates, key);
    if (isEmpty(templatesForKey)) return [];
    if (key !== MEASUREMENT_TEMPLATE_KEY) return [{templateKey: key, label: getTemplatesLabel(key), data: templatesForKey}];
    return MEASUREMENT_TYPES.filter(measurementType => measurementType.key !== MEASUREMENT_KEYS.PLANAR_LINEAR)
      .map(measurementType => ({
        templateKey: key,
        label: measurementType.title,
        data: templatesForKey.filter(t => measurementType.form_keys.includes(t.values.type)),
      }))
      .filter(section => !isEmpty(section.data));
  });
  // Sorted as copies: a section's data is the stored template list itself, which the store has frozen
  return sections
    .map(section => ({...section, data: [...section.data].sort((a, b) => a.name.localeCompare(b.name))}))
    .sort((a, b) => a.label.localeCompare(b.label));
};
