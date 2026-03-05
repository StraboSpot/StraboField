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