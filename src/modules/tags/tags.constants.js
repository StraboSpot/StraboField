import {SMALL_TEXT_SIZE} from '../../shared/styles.constants';

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

export const TAG_TYPES = {
  GEOLOGIC_UNIT: 'geologic_unit',
  CONCEPT: 'concept',
};

export const TAG_FORM_NAMES = {
  GEOLOGIC_UNIT: ['project', 'geologic_unit'],
  TAGS: ['project', 'tags'],
};

// The count chips stand where a subtitle would, so their icons are sized to that line of text rather than to the
// 20px a Spot row gives the icons on a line of their own
export const TAG_COUNT_ICON_SIZE = SMALL_TEXT_SIZE + 2;
