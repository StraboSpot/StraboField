import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';

export const MEASUREMENT_TEMPLATE_KEY = 'measurementTemplates';

// Planar, linear and tabular templates all share MEASUREMENT_TEMPLATE_KEY, told apart by their values.type
export const MEASUREMENT_TEMPLATE_TYPES = [MEASUREMENT_KEYS.PLANAR, MEASUREMENT_KEYS.LINEAR, MEASUREMENT_KEYS.TABULAR];

// What a template never holds, so its form doesn't show it and saving drops it. A label, as a template's values are
// copied into every feature made from it and each is labeled for itself. For a measurement, also the reading, which
// the compass or the user supplies; these are the fields its measurement_bulk survey leaves out.
export const TEMPLATE_EXCLUDED_FIELDS = ['label'];
export const MEASUREMENT_TEMPLATE_EXCLUDED_FIELDS = [...TEMPLATE_EXCLUDED_FIELDS, 'strike', 'dip_direction', 'dip',
  'trend', 'plunge', 'rake', 'rake_calculated'];

// The template's name, kept in the form beside its values while it is edited. Not a field of any survey, so it can't
// collide with one, and it is taken back out before the values are saved.
export const TEMPLATE_NAME_FIELD = 'template_name';

// Names the name field in a template form's error messages, as it isn't in a survey to be named by
export const TEMPLATE_FIELD_LABELS = {[TEMPLATE_NAME_FIELD]: 'Template Name'};

export const TEMPLATE_BACKUP_ACTIONS = {
  BACKUP_TEMPLATES: 'backupTemplates',
};

export const TEMPLATE_BACKUP_MESSAGES = {
  TITLE: 'Templates',
  STATUS: {
    ZIPPING: 'Saving ',
    EXPORTING: 'Exporting ',
    ZIPPED: ' Saved',
    EXPORTED: ' Exported!',
    FAILED: 'Export Failed!',
  },
};

export const TEMPLATE_BACKUP_STATUS = {
  IN_PROGRESS: 'inProgress',
  COMPLETE: 'complete',
  ERROR: 'error',
};
