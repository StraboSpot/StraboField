export const MAIN_MENU_TITLE = 'StraboField';

export const MAIN_MENU_ITEMS = {
  MANAGE: {
    MY_STRABOSPOT: 'My StraboSpot',
    ACTIVE_PROJECTS: 'Active Project',
    UPLOAD_BACKUP_EXPORT: 'Upload, Backup & Export',
    // DATABASE_DETAILS: 'Database Details',
    STRABOMICRO_PROJECTS: 'StraboMicro Projects',
    REPORTS: 'Reports',
  },
  ATTRIBUTES: {
    SPOTS: 'Spots',
    IMAGE_GALLERY: 'Image Gallery',
    SAMPLES: 'Samples',
    GEOLOGIC_UNITS: 'Geologic Units',
    TAGS: 'Tags',
  },
  MAPS: {
    CUSTOM: 'Custom Maps',
    IMAGE_BASEMAPS: 'Image Basemaps',
    STRAT_SECTIONS: 'Strat Sections',
    MANAGE_OFFLINE_MAPS: 'Manage Offline Maps',
  },
  PREFERENCES: {
    SHORTCUTS: 'Shortcuts',
    // NOTEBOOK_BAR: 'Notebook Bar',
    NAMING_CONVENTIONS: 'Naming Conventions',
    MISCELLANEOUS: 'Miscellaneous',
    // UNITS: 'Units',
  },
  HELP: {
    ABOUT: 'About Strabo',
    DOCUMENTATION: 'Documentation',
    ISSUES: 'Issues & Requests',
  },
};

export const MAIN_MENU_DATA = Object.entries(MAIN_MENU_ITEMS).map(([key, value]) => {
  return {title: key, data: Object.values(value)};
});

export const SIDE_PANEL_VIEWS = {
  DATASET_DETAIL: 'Dataset Detail',
  MANAGE_CUSTOM_MAP: 'manageCustomMap',
  PROJECT_DESCRIPTION: 'project description',
  TAG_DETAIL: 'tag detail',
  TAG_ADD_REMOVE_SPOTS: 'add remove tag spots',
  TAG_ADD_REMOVE_FEATURES: 'add remove tag features',
  USER_PROFILE: 'userProfile',
};
