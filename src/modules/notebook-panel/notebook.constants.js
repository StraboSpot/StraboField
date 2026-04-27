import {SMALL_SCREEN} from '../../shared/styles.constants';

export const NOTEBOOK_MENU_ACTIONS = [
  {key: 'copy', title: 'Copy this Spot'},
  {key: 'zoom', title: 'Zoom to this Spot'},
  {key: 'delete', title: 'Delete this Spot'},
  {key: 'geography', title: 'Show Geography'},
  {key: 'metadata', title: 'Show Metadata'},
  {key: 'nesting', title: 'Show Nesting'},
  {key: 'rockd', title: 'Send Spot to Rock\'d'},
  ...(!SMALL_SCREEN ? [{key: 'close', title: 'Close Notebook'}] : []),
];

export const TRACE_SUB_TYPE_FIELDS = [
  'contact_type',
  'geologic_structure_type',
  'geomorphic_feature',
  'antropogenic_feature',
  'other_feature',
];
