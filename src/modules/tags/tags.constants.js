import {SMALL_TEXT_SIZE} from '../../shared/styles.constants';

export const TAG_TYPES = {
  GEOLOGIC_UNIT: 'geologic_unit',
  CONCEPT: 'concept',
  DOCUMENTATION: 'documentation',
  ROSETTA: 'rosetta',
  EXPERIMENTAL_APPARATUS: 'experimental_apparatus',
  OTHER: 'other',
};

export const TAG_SECTIONS = {
  GEOLOGIC_UNITS: [
    {title: 'Geologic Units', key: TAG_TYPES.GEOLOGIC_UNIT},
  ],
  DEFAULT: [
    {title: 'Concepts', key: TAG_TYPES.CONCEPT},
    {title: 'Documentation', key: TAG_TYPES.DOCUMENTATION},
    {title: 'Rosetta', key: TAG_TYPES.ROSETTA},
    {title: 'Experimental Apparatus', key: TAG_TYPES.EXPERIMENTAL_APPARATUS},
    {title: 'Other', key: TAG_TYPES.OTHER},
    {title: 'No Type Specified', key: undefined},
  ],
};

export const TAG_FORM_NAMES = {
  GEOLOGIC_UNIT: ['project', 'geologic_unit'],
  TAGS: ['project', 'tags'],
};

// The count chips stand where a subtitle would, so their icons are sized to that line of text rather than to the
// 20px a Spot row gives the icons on a line of their own
export const TAG_COUNT_ICON_SIZE = SMALL_TEXT_SIZE + 2;
