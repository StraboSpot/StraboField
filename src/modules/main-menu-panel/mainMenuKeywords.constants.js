import {MAIN_MENU_ITEMS} from './mainMenu.constants';

export const MENU_KEYWORDS = {
  MANAGE_PROJECT: [
    {
      key: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS,
      keywords: ['datasets', 'read only', 'visible', 'target', 'download images'],
    },
    {
      key: MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP,
      keywords: ['backup', 'upload', 'save', 'export', 'zip'],
    },
    {
      key: MAIN_MENU_ITEMS.MANAGE_PROJECT.DESCRIPTION,
      keywords: ['description', 'title', 'date', 'note', 'instruments', 'gps', 'datum', 'magnetic declination', 'magnetic', 'declination'],
    },
    {
      key: MAIN_MENU_ITEMS.MANAGE_PROJECT.SETTINGS,
      keywords: ['settings', 'privacy', 'public', 'private'],
    },
  ],
  CUSTOMIZE_AND_PRESET: [
    {
      key: MAIN_MENU_ITEMS.CUSTOMIZE_AND_PRESET.NAMING_CONVENTIONS,
      keywords: ['naming conventions', 'naming', 'conventions'],
    },
    {
      key: MAIN_MENU_ITEMS.CUSTOMIZE_AND_PRESET.CUSTOM_FEATURE_TYPES,
      keywords: ['custom feature types'],
    },
  ],
  PROJECT_DATA: [
    {
      key: MAIN_MENU_ITEMS.PROJECT_DATA.SPOTS,
      keywords: ['spots'],
    },
    {
      key: MAIN_MENU_ITEMS.PROJECT_DATA.IMAGES,
      keywords: ['images', 'photos', 'sketches'],
    },
    {
      key: MAIN_MENU_ITEMS.PROJECT_DATA.SAMPLES,
      keywords: ['samples', 'igsn', 'sesar'],
    },
    {
      key: MAIN_MENU_ITEMS.PROJECT_DATA.TAGS,
      keywords: ['tags'],
    },
    {
      key: MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS,
      keywords: ['geologic units', 'unit', 'units'],
    },
    {
      key: MAIN_MENU_ITEMS.PROJECT_DATA.STRAT_SECTIONS,
      keywords: ['stratigraphic sections', 'stratigraphic', 'strat', 'column', 'strat column'],
    },
    {
      key: MAIN_MENU_ITEMS.PROJECT_DATA.REPORTS,
      keywords: ['reports'],
    },
    {
      key: MAIN_MENU_ITEMS.PROJECT_DATA.DAILY_NOTES,
      keywords: ['notes', 'daily notes'],
    },
  ],
  MAPS: [
    {
      key: MAIN_MENU_ITEMS.MAPS.CUSTOM,
      keywords: ['maps', 'custom', 'custom maps', 'overlays'],
    },
    {
      key: MAIN_MENU_ITEMS.MAPS.IMAGE_BASEMAPS,
      keywords: ['image basemaps', 'images'],
    },
    {
      key: MAIN_MENU_ITEMS.MAPS.MANAGE_OFFLINE_MAPS,
      keywords: ['offline maps'],
    },
  ],
  ACCOUNT: [
    {
      key: MAIN_MENU_ITEMS.ACCOUNT.PROFILE,
      keywords: ['account', 'profile', 'access tokens', 'tokens', 'download user profile', 'delete account', 'log out', 'sign out'],
    },
    {
      key: MAIN_MENU_ITEMS.ACCOUNT.STRABOFIELD_PROJECTS,
      keywords: ['strabofield', 'projects', 'load', 'new', 'open', 'download', 'import', 'delete', 'export', 'zip', 'log out', 'sign out'],
    },
    {
      key: MAIN_MENU_ITEMS.ACCOUNT.STRABOMICRO_PROJECTS,
      keywords: ['strabomicro', 'micro'],
    },
    {
      key: MAIN_MENU_ITEMS.ACCOUNT.USER_CONVENTIONS,
      keywords: ['user conventions', 'convert', 'dip direction', 'measurement convention'],
    },
  ],
  APP_SETTINGS: [
    {
      key: MAIN_MENU_ITEMS.APP_SETTINGS.ADDING_NEW_SPOTS,
      keywords: ['shortcuts'],
    },
    {
      key: MAIN_MENU_ITEMS.APP_SETTINGS.ADVANCED_OPTIONS,
      keywords: ['endpoint', 'server', 'testing', 'random'],
    },
  ],
  HELP: [
    {
      key: MAIN_MENU_ITEMS.HELP.ABOUT,
      keywords: ['about', 'version'],
    },
    {
      key: MAIN_MENU_ITEMS.HELP.DOCUMENTATION,
      keywords: ['help', 'documentation', 'data model', 'spot data model'],
    },
    {
      key: MAIN_MENU_ITEMS.HELP.ISSUES,
      keywords: ['issues', 'requests', 'bugs', 'support', 'email', 'github'],
    },
  ],
};
