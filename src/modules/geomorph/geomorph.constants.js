import {getOrientationFields} from '../compass/compass.helpers';
import {PAGE_KEYS} from '../page/pageKeys.constants';

const CONFIDENCE_IN_FEATURE_KEY = 'confidence_in_feature';
const EARTHQUAKE_GROUP_KEY = 'general';
const EARTHQUAKE_PAGE_KEY = PAGE_KEYS.EARTHQUAKES;
const EARTHQUAKE_FORM_NAME = [EARTHQUAKE_GROUP_KEY, EARTHQUAKE_PAGE_KEY];

const FAULT_ORIENTATION_KEYS = {
  group_fs5ba04: {
    strike: 'strike',
    dip_direction: 'azimuth_dip_dir',
    dip: 'dip',
    quality: 'meas_quality',
  },
};

const EARTHQUAKE_ORIENTATION_FIELDS = getOrientationFields(FAULT_ORIENTATION_KEYS);

const LAST_KEYS = ['diameter', 'height_of_material', 'max_vert_movement', 'dir_of_slope_mov',
  'displacement_amt', 'depth', 'max_drop_in_elevation', 'length_exposed_downslope', 'slip_preferred', 'slip_min',
  'slip_max', 'horiz_sep_pref', 'horiz_sep_min', 'horiz_sep_max', 'vert_sep_pref', 'vert_sep_min', 'vertical_sep_max',
  'slip_azimuth', 'heave_pref', 'heave_min', 'rupture_width_pref', 'rupture_width_min', 'rupture_width_max', 'notes'];

const MAIN_BUTTONS_KEYS_1 = ['earthquake_feature', 'fault_type'];
const MAIN_BUTTONS_KEYS_2 = ['movement', 'rupture_expression',
  'liquefaction_area_affected', 'fault_slip_meas', 'date_of_movement', 'time_of_movement', 'landslide_feat',
  'slide_type', 'material_type', 'area_affected', 'cause_of_damage', 'date_of_damage', 'time_of_damage',
  'utility_affected', 'facility_affected', 'damage_severity', 'mode_of_observation'];

const VECTOR_MEASUREMENT_KEYS = {
  group_bf6rc11: {
    trend: 'trend',
    plunge: 'plunge',
    quality: 'vector_meas_confidence',
  },
};

export {
  CONFIDENCE_IN_FEATURE_KEY,
  EARTHQUAKE_FORM_NAME,
  EARTHQUAKE_GROUP_KEY,
  EARTHQUAKE_ORIENTATION_FIELDS,
  EARTHQUAKE_PAGE_KEY,
  FAULT_ORIENTATION_KEYS,
  LAST_KEYS,
  MAIN_BUTTONS_KEYS_1,
  MAIN_BUTTONS_KEYS_2,
  VECTOR_MEASUREMENT_KEYS,
};
