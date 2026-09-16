import {MEASUREMENT_TEMPLATE_KEY} from './templates.constants';
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
  t => t.values?.type === 'planar_orientation' || t.values?.type === 'tabular_orientation'
    || t.type === 'planar_orientation');
  t => isPlanarType(t.values?.type) || t.type === MEASUREMENT_KEYS.PLANAR);

// The keys of `templates` that name a template bucket - Object.keys would also hand back the two measurement
// fields that sit alongside the buckets rather than inside one.
export const getTemplateKeys = templates => Object.keys(templates || {}).filter(
  key => key !== MEASUREMENT_FIELD_NAMES.active && key !== MEASUREMENT_FIELD_NAMES.isInUse);

export const getTemplateList = (templates, key) => getTemplateField(templates, key, 'templates');

export const setActiveTemplateList = (templates, key, value) => setTemplateField(templates, key, 'active', value);

export const setIsTemplateInUse = (templates, key, value) => setTemplateField(templates, key, 'isInUse', value);

export const setTemplateList = (templates, key, value) => setTemplateField(templates, key, 'templates', value);
