import {
  MEASUREMENT_TEMPLATE_EXCLUDED_FIELDS,
  MEASUREMENT_TEMPLATE_KEY,
  TEMPLATE_EXCLUDED_FIELDS,
  TEMPLATE_NAME_FIELD,
} from './templates.constants';
import {isEmpty} from '../../shared/helpers';
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

export const getPlanarTemplates = templatesToFilter => templatesToFilter.filter(
  t => isPlanarType(t.values?.type) || t.type === MEASUREMENT_KEYS.PLANAR);

// What a template's form starts from: its values, with its name beside them to be edited in the same form
export const getTemplateFormValues = template => ({...template.values, [TEMPLATE_NAME_FIELD]: template.name});

// A feature survey as a template's form shows it, without the fields a template never holds
export const getTemplateSurvey = survey => survey.filter(field => !TEMPLATE_EXCLUDED_FIELDS.includes(field.name));

// The values a template keeps from its form: everything but its name, the fields a template never holds, and an id,
// which an older template can still carry from the feature it was made from
export const getTemplateValues = (templateKey, formValues) => {
  const excludedFields = templateKey === MEASUREMENT_TEMPLATE_KEY ? MEASUREMENT_TEMPLATE_EXCLUDED_FIELDS
    : TEMPLATE_EXCLUDED_FIELDS;
  return Object.fromEntries(Object.entries(formValues).filter(
    ([key]) => key !== 'id' && key !== TEMPLATE_NAME_FIELD && !excludedFields.includes(key)));
};

// The keys of `templates` that name a template bucket - Object.keys would also hand back the two measurement
// fields that sit alongside the buckets rather than inside one.
export const getTemplateKeys = templates => Object.keys(templates || {}).filter(
  key => key !== MEASUREMENT_FIELD_NAMES.active && key !== MEASUREMENT_FIELD_NAMES.isInUse);

export const getTemplateList = (templates, key) => getTemplateField(templates, key, 'templates');

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
