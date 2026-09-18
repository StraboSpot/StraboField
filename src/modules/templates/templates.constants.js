import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';

export const MEASUREMENT_TEMPLATE_KEY = 'measurementTemplates';

// Planar, linear and tabular templates all share MEASUREMENT_TEMPLATE_KEY, told apart by their values.type
export const MEASUREMENT_TEMPLATE_TYPES = [MEASUREMENT_KEYS.PLANAR, MEASUREMENT_KEYS.LINEAR, MEASUREMENT_KEYS.TABULAR];

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
