export const MAIN_MENU_TITLE = 'StraboField';

export const MAIN_MENU_ITEMS = {
  MANAGE_PROJECT: {
    DATASETS: 'Datasets ',
    BACKUP: 'Backup Options',
    DESCRIPTION: 'Project Description',
    SETTINGS: 'Project Settings',
  },
  PROJECT_DATA: {
    SPOTS: 'Spots',
    IMAGES: 'Images',
    SAMPLES: 'Samples',
    TAGS: 'Tags',
    GEOLOGIC_UNITS: 'Geologic Units',
    STRAT_SECTIONS: 'Strat Sections',
    REPORTS: 'Reports',
    DAILY_NOTES: 'Daily Notes',
    CUSTOM_PRESETS: 'Custom Presets',
  },
  MAPS: {
    CUSTOM: 'Custom Maps',
    IMAGE_BASEMAPS: 'Image Basemaps',
    MANAGE_OFFLINE_MAPS: 'Offline Maps',
  },
  MY_STRABOSPOT: {
    STRABOFIELD_PROJECTS: 'StraboField Projects',
    STRABOMICRO_PROJECTS: 'StraboMicro Projects',
    ACCOUNT: 'Account',
  },
  SETTINGS: {
    MAP_BUTTON_OPTIONS: 'Map Button Options',
    APP_SETTINGS: 'App Settings',
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
  DELETE_PROJECT: 'Delete Project',
  DOWNLOAD_PROJECT: 'Download Project',
  IMPORT_PROJECT: 'Import Project',
  MANAGE_CUSTOM_MAP: 'manageCustomMap',
  NEW_PROJECT: 'New Project',
  OPEN_PROJECT: 'Open Project',
  TAG_ADD_REMOVE_FEATURES: 'add remove tag features',
  TAG_ADD_REMOVE_SPOTS: 'add remove tag spots',
  TAG_DETAIL: 'tag detail',
};
