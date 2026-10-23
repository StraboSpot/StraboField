import {
  MEASUREMENT_TEMPLATE_EXCLUDED_FIELDS,
  MEASUREMENT_TEMPLATE_KEY,
  TEMPLATE_EXCLUDED_FIELDS,
  TEMPLATE_NAME_FIELD,
} from './templates.constants';
import forms from '../../assets/forms';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';
import {isPlanarType} from '../measurements/measurements.helpers';

// Every template key stores the same three things: its templates, which of them are active, and whether
// templates are switched on for that key. All but measurements keep theirs in one bucket at templates[key];
// measurements keep theirs as three flat siblings of those buckets. Nothing needs that difference - it is
// just how it was first stored, and it now sits in projects on the server - so no one indexes `templates`
// directly. Every caller goes through the accessors below and the difference stays in this file.
const MEASUREMENT_FIELD_NAMES = {
  active: 'activeMeasurementTemplates',
  isInUse: 'useMeasurementTemplates',
  templates: 'measurementTemplates',
};

// Returns undefined rather than a default for a key that has never been used, so that a getter called inside
// a selector hands back the same reference each time instead of a new empty array on every store change.
const getTemplateField = (templates, key, field) => key === MEASUREMENT_TEMPLATE_KEY
  ? templates?.[MEASUREMENT_FIELD_NAMES[field]] : templates?.[key]?.[field];

// Folds one key's imported templates into the ones already there. A template matched by id keeps every value
// it already has and gains the ones it was missing, so an import can fill a template in but never overwrite it.
const mergeTemplateList = (existing, imported) => {
  const merged = [...existing];
  let newCount = 0;
  let mergedCount = 0;
  for (const importedTemplate of imported) {
    const existingIndex = merged.findIndex(t => t.id === importedTemplate.id);
    if (existingIndex >= 0) {
      const matchedTemplate = merged[existingIndex];
      const mergedValues = {...importedTemplate.values};
      for (const [valueKey, value] of Object.entries(matchedTemplate.values || {})) {
        if (value !== undefined && value !== null) mergedValues[valueKey] = value;
      }
      merged[existingIndex] = {...importedTemplate, ...matchedTemplate, values: mergedValues};
      mergedCount++;
    }
    else {
      merged.push(importedTemplate);
      newCount++;
    }
  }
  return {merged, newCount, mergedCount};
};

// Writes into the caller's own `templates` - a Redux draft, a shallow copy being merged into, a backup being
// built up - so it writes in place, replacing a bucket rather than mutating one a shallow copy still shares.
const setTemplateField = (templates, key, field, value) => {
  if (key === MEASUREMENT_TEMPLATE_KEY) templates[MEASUREMENT_FIELD_NAMES[field]] = value;
  else templates[key] = {...templates[key], [field]: value};
};

// Drops a key and every field it owns, for when its last template is deleted.
export const deleteTemplateKey = (templates, key) => {
  if (key === MEASUREMENT_TEMPLATE_KEY) Object.values(MEASUREMENT_FIELD_NAMES).forEach(f => delete templates[f]);
  else delete templates[key];
};

export const getActiveTemplateList = (templates, key) => getTemplateField(templates, key, 'active');

export const getIsTemplateInUse = (templates, key) => getTemplateField(templates, key, 'isInUse');

export const getLinearTemplates = templatesToFilter => templatesToFilter.filter(
  t => t.values?.type === MEASUREMENT_KEYS.LINEAR || t.type === MEASUREMENT_KEYS.LINEAR);

// The kinds of template that can be made, in sections for the main menu's list: each a form key, named for the list
export const getNewTemplateSections = () => {
  const toItems = keys => keys.map(key => ({id: key, name: getTemplateTitle(key)}));
  return [
    {title: 'measurement', data: toItems(Object.keys(forms.measurement))},
    {title: 'notes', data: toItems(['notes'])},
    {title: 'pet', data: toItems(Object.keys(forms.pet).filter(key => key !== 'reactions'))},
  ];
};

export const getPlanarTemplates = templatesToFilter => templatesToFilter.filter(
  t => isPlanarType(t.values?.type) || t.type === MEASUREMENT_KEYS.PLANAR);

// The project's templates in sections for the main menu's list, each section and the templates in it sorted by name.
// Measurements are the one key whose templates are not all of a kind - planar, tabular and linear share a bucket and
// are told apart by type - so they get a section each rather than one for the key.
export const getSavedTemplateSections = (templates) => {
  const sections = getTemplateKeys(templates).flatMap((key) => {
    const templatesForKey = getTemplateList(templates, key);
    if (isEmpty(templatesForKey)) return [];
    if (key !== MEASUREMENT_TEMPLATE_KEY) return [{title: key, data: templatesForKey}];
    const types = [...new Set(templatesForKey.map(t => t.values.type))];
    return types.map(type => ({title: type, data: templatesForKey.filter(t => t.values.type === type)}));
  });
  // Sorted as copies: a section's data is the stored template list itself, which the store has frozen
  return sections.map(section => ({...section, data: [...section.data].sort((a, b) => a.name.localeCompare(b.name))}))
    .sort((a, b) => a.title.localeCompare(b.title));
};

// What a template's form starts from: its values, with its name beside them to be edited in the same form
export const getTemplateFormValues = template => ({...template.values, [TEMPLATE_NAME_FIELD]: template.name});

// The keys of `templates` that name a template bucket - Object.keys would also hand back the two measurement
// fields that sit alongside the buckets rather than inside one.
export const getTemplateKeys = templates => Object.keys(templates || {}).filter(
  key => key !== MEASUREMENT_FIELD_NAMES.active && key !== MEASUREMENT_FIELD_NAMES.isInUse);

export const getTemplateList = (templates, key) => getTemplateField(templates, key, 'templates');

// A template key or type as the main menu names it
export const getTemplateTitle = (key) => {
  if (key === 'alteration_or') return 'Alteration, Ore Rock';
  else if (key === 'fault') return 'Fault & Shear Zone Rock';
  else if (key === 'plutonic' || key === 'volcanic' || key === 'metamorphic') return toTitleCase(key) + ' Rock';
  else if (key === 'minerals') return 'Mineral';
  else if (key === MEASUREMENT_KEYS.TABULAR) return 'Tabular Zone Orientation';
  else if (key === 'pet') return 'Rocks & Minerals';
  else if (key) return toTitleCase(key.replaceAll('_', ' ').trim());
};

// A feature survey as a template's form shows it, without the fields a template never holds
export const getTemplateSurvey = survey => survey.filter(field => !TEMPLATE_EXCLUDED_FIELDS.includes(field.name));

// What the templates of a type are called: a measurement's by its orientation, an igneous rock's by its class, the
// rest by their page
export const getTemplateTypeLabel = (type, page, isIgneousRock) => (isPlanarType(type) ? 'Planar'
  : type === MEASUREMENT_KEYS.LINEAR ? 'Linear'
    : isIgneousRock ? toTitleCase(type) + ' Rock'
      : page.label_singular || toTitleCase(page.label).slice(0, -1) || 'Unknown');

// The values a template keeps from its form: everything but its name, the fields a template never holds, and an id,
// which an older template can still carry from the feature it was made from
export const getTemplateValues = (templateKey, formValues) => {
  const excludedFields = templateKey === MEASUREMENT_TEMPLATE_KEY ? MEASUREMENT_TEMPLATE_EXCLUDED_FIELDS
    : TEMPLATE_EXCLUDED_FIELDS;
  return Object.fromEntries(Object.entries(formValues).filter(
    ([key]) => key !== 'id' && key !== TEMPLATE_NAME_FIELD && !excludedFields.includes(key)));
};

// The templates of one measurement orientation, planar taking in tabular, or every template for any other type
export const getTemplatesOfType = (templatesToFilter, type) => (isPlanarType(type) ? getPlanarTemplates(templatesToFilter)
  : type === MEASUREMENT_KEYS.LINEAR ? getLinearTemplates(templatesToFilter) : templatesToFilter);

// Merges a whole imported `templates` object into the project's own, counting what was added and what was
// filled in. Hands back a new object, leaving `existing` as it found it - that is still the live state.
export const mergeTemplates = (existing, imported) => {
  const mergedTemplates = {...existing};
  let newCount = 0;
  let mergedCount = 0;
  for (const key of getTemplateKeys(imported)) {
    const importedForKey = getTemplateList(imported, key);
    if (!Array.isArray(importedForKey)) continue;
    const {merged, newCount: newForKey, mergedCount: mergedForKey}
      = mergeTemplateList(getTemplateList(existing, key) || [], importedForKey);
    setTemplateList(mergedTemplates, key, merged);
    // An active template is a full copy of the template, not a reference, so the copy has to be refreshed
    // too - otherwise a template that gained values here keeps prefilling forms with the ones it had before.
    const activeForKey = getActiveTemplateList(existing, key);
    if (!isEmpty(activeForKey)) {
      setActiveTemplateList(mergedTemplates, key,
        activeForKey.map(active => merged.find(t => t.id === active.id) || active));
    }
    newCount += newForKey;
    mergedCount += mergedForKey;
  }
  return {mergedTemplates, newCount, mergedCount};
};

export const setActiveTemplateList = (templates, key, value) => setTemplateField(templates, key, 'active', value);

export const setIsTemplateInUse = (templates, key, value) => setTemplateField(templates, key, 'isInUse', value);

export const setTemplateList = (templates, key, value) => setTemplateField(templates, key, 'templates', value);

// A template form's errors for its name, to add to the errors for its values
export const validateTemplateName = values => (isEmpty(values[TEMPLATE_NAME_FIELD]?.trim())
  ? {[TEMPLATE_NAME_FIELD]: 'Required'} : {});
