export const MAIN_MENU_TITLE = 'StraboField';

export const MAIN_MENU_ITEMS = {
  MANAGE_PROJECT: {
    DATASETS: 'Datasets',
    BACKUP: 'Backup',
    DESCRIPTION: 'Project Description',
    SETTINGS: 'Privacy',
  },
  CUSTOMIZE_AND_PRESET: {
    NAMING_CONVENTIONS: 'Naming Conventions',
    TEMPLATES: 'Templates',
    CUSTOM_FEATURE_TYPES: 'Custom Feature Types',
    // FORMS_PAGES: 'Forms/Pages',
  },
  PROJECT_DATA: {
    SPOTS: 'Spots',
    IMAGES: 'Images',
    SAMPLES: 'Samples',
    TAGS: 'Tags',
    GEOLOGIC_UNITS: 'Geologic Units',
    STRAT_SECTIONS: 'Stratigraphic Sections',
    REPORTS: 'Reports',
    DAILY_NOTES: 'Daily Notes',
  },
  MAPS: {
    CUSTOM: 'Custom Maps',
    IMAGE_BASEMAPS: 'Image Basemaps',
    MANAGE_OFFLINE_MAPS: 'Offline Maps',
  },
  ACCOUNT: {
    PROFILE: 'Profile',
    STRABOFIELD_PROJECTS: 'StraboField Projects',
    STRABOMICRO_PROJECTS: 'StraboMicro Projects',
    USER_CONVENTIONS: 'User Conventions',
  },
  APP_SETTINGS: {
    ADDING_NEW_SPOTS: 'Adding New Spots',
    ADVANCED_OPTIONS: 'Advanced Options',
  },
  HELP: {
    ABOUT: 'About StraboField',
    DOCUMENTATION: 'Documentation',
    ISSUES: 'Issues & Requests',
  },
};

export const MAIN_MENU_DATA = Object.entries(MAIN_MENU_ITEMS).map(([key, value]) => {
  return {title: key, data: Object.values(value)};
});

const listItemsToHideOnWeb = [
  MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP,
  MAIN_MENU_ITEMS.ACCOUNT.STRABOFIELD_PROJECTS,
  MAIN_MENU_ITEMS.ACCOUNT.STRABOMICRO_PROJECTS,
  MAIN_MENU_ITEMS.MAPS.MANAGE_OFFLINE_MAPS];
export const MAIN_MENU_DATA_WEB = Object.entries(MAIN_MENU_ITEMS).map(([key, value]) => {
  return {
    title: key,
    data: Object.values(value).reduce((acc, val) => listItemsToHideOnWeb.includes(val) ? acc : [...acc, val], []),
  };
});

const sectionsToHideIfNoProject = ['MANAGE_PROJECT', 'CUSTOMIZE_AND_PRESET', 'PROJECT_DATA', 'MAPS'];
export const MAIN_MENU_DATA_NO_PROJECT = Object.entries(MAIN_MENU_ITEMS).reduce((acc, [key, value]) => {
  return sectionsToHideIfNoProject.includes(key) ? acc : [...acc, {title: key, data: Object.values(value)}];
}, []);

const listItemsToHideIfNoUser = [MAIN_MENU_ITEMS.ACCOUNT.STRABOMICRO_PROJECTS];
export const MAIN_MENU_DATA_NO_USER = Object.entries(MAIN_MENU_ITEMS).map(([key, value]) => {
  return {
    title: key,
    data: Object.values(value).reduce((acc, val) => listItemsToHideIfNoUser.includes(val) ? acc : [...acc, val], []),
  };
});

export const MAIN_MENU_DATA_NO_PROJECT_NO_USER = MAIN_MENU_DATA_NO_PROJECT.map(({title, data}) => {
  return {title, data: data.filter(val => !listItemsToHideIfNoUser.includes(val))};
});

export const SIDE_PANEL_VIEWS = {
  DATASET_DETAIL: 'Dataset Detail',
  DELETE_PROJECT: 'Delete Locally Saved Project',
  DOWNLOAD_PROJECT: 'Download Project',
  EXPORT_PROJECT: 'Export Locally Saved Project',
  IMPORT_PROJECT: 'Import Project',
  MANAGE_CUSTOM_MAP: 'manageCustomMap',
  NEW_PROJECT: 'New Project',
  OPEN_PROJECT: 'Open Project',
  TAG_ADD_REMOVE_FEATURES: 'add remove tag features',
  TAG_ADD_REMOVE_SAMPLE_SPOTS: 'add remove tag sample spots',
  TAG_ADD_REMOVE_SPOTS: 'add remove tag spots',
  TAG_DETAIL: 'tag detail',
};
