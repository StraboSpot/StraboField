export const TAG_SECTIONS = {
  GEOLOGIC_UNITS: [
    {title: 'Geologic Units', key: 'geologic_unit'},
  ],
  DEFAULT: [
    {title: 'Concepts', key: 'concept'},
    {title: 'Documentation', key: 'documentation'},
    {title: 'Rosetta', key: 'rosetta'},
    {title: 'Experimental Apparatus', key: 'experimental_apparatus'},
    {title: 'Other', key: 'other'},
    {title: 'No Type Specified', key: undefined},
  ],
};

export const TAG_SUBTYPE_FIELDS = [
  'other_concept_type',
  'other_documentation_type',
  'concept_type',
  'documentation_type',
];

export const TAG_ROCK_UNIT_FIELDS = [
  'unit_label_abbreviation',
  'map_unit_name',
  'member_name',
  'rock_type',
];

// Tag Types
export const TAG_TYPES = {
  GEOLOGIC_UNIT: 'geologic_unit',
  CONCEPT: 'concept',
};

// Form Names
export const TAG_FORM_NAMES = {
  GEOLOGIC_UNIT: ['project', 'geologic_unit'],
  TAGS: ['project', 'tags'],
};

// Backup Actions
export const TAG_BACKUP_ACTIONS = {
  BACKUP_GEOLOGIC_UNITS: 'backupGeologicUnits',
  BACKUP_TAGS: 'backupTags',
};

// Backup Messages
export const TAG_BACKUP_MESSAGES = {
  TITLE: {
    GEOLOGIC_UNITS: 'Geologic Units',
    TAGS: 'Tags',
  },
  STATUS: {
    ZIPPING: 'Zipping ',
    EXPORTING: 'Exporting ',
    ZIPPED: ' Zipped',
    EXPORTED: ' Exported to Zip!',
    FAILED: 'Export Failed!',
  },
};

// Backup Status
export const TAG_BACKUP_STATUS = {
  IN_PROGRESS: 'inProgress',
  COMPLETE: 'complete',
  ERROR: 'error',
};
