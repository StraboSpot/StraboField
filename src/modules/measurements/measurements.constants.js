import {COMPASS_TOGGLE_BUTTONS} from '../compass/compass.constants';

export const MEASUREMENT_KEYS = {
  PLANAR: 'planar_orientation',
  LINEAR: 'linear_orientation',
  PLANAR_LINEAR: 'planar_linear',
};

export const MEASUREMENT_TYPES = [
  {
    key: MEASUREMENT_KEYS.PLANAR,
    title: 'Planar Measurements',
    add_title: 'Plane',
    save_title: 'Planar Feature',
    form_keys: ['planar_orientation', 'tabular_orientation'],
    compass_toggles: [COMPASS_TOGGLE_BUTTONS.PLANAR],
  },
  {
    key: MEASUREMENT_KEYS.LINEAR,
    title: 'Linear Measurements',
    add_title: 'Line',
    save_title: 'Linear Feature',
    form_keys: ['linear_orientation'],
    compass_toggles: [COMPASS_TOGGLE_BUTTONS.LINEAR],
  },
  {
    key: MEASUREMENT_KEYS.PLANAR_LINEAR,
    title: 'P + L Measurements',
    add_title: 'P + L',
    save_title: 'Planar with Linear Feature',
    form_keys: ['planar_orientation', 'linear_orientation', 'tabular_orientation'],
    compass_toggles: [COMPASS_TOGGLE_BUTTONS.PLANAR, COMPASS_TOGGLE_BUTTONS.LINEAR],
  },
];

export const FIRST_ORDER_CLASS_FIELDS = ['feature_type', 'type'];

export const SECOND_ORDER_CLASS_FIELDS = ['other_feature', 'vorticity', 'bedding_type', 'contact_type',
  'foliation_type', 'fracture_type', 'vein_type', 'fault_or_sz_type', 'strat_type', 'intrusive_body_type',
  'injection_type', 'fracture_zone', 'fault_or_sz', 'damage_zone', 'alteration_zone', 'enveloping_surface'];

// AddLine keys
export const ADD_LINE_FIRST_KEYS = ['label'];
export const ADD_LINE_MAIN_BUTTONS_KEYS = ['feature_type'];
export const ADD_LINE_LAST_KEYS = ['defined_by', 'notes'];

// AddPlane keys
export const ADD_PLANE_FIRST_KEYS = ['label'];
export const ADD_PLANE_MAIN_BUTTONS_KEYS = ['feature_type'];
export const ADD_PLANE_BEDDING_BUTTONS_KEYS = ['bedding_type'];
export const ADD_PLANE_CONTACT_BUTTONS_KEYS = ['contact_type'];
export const ADD_PLANE_FOLIATION_BUTTONS_KEYS = ['foliation_type', 'directional_indicators'];
export const ADD_PLANE_FRACTURE_BUTTONS_KEYS = ['fracture_type', 'directional_indicators'];
export const ADD_PLANE_VEIN_BUTTONS_KEYS = ['vein_type'];
export const ADD_PLANE_FAULT_BUTTONS_KEYS = ['fault_or_sz_type', 'directional_indicators'];
export const ADD_PLANE_LAST_KEYS = ['thickness', 'length', 'notes'];

// Measurement group and form names
export const MEASUREMENT_GROUP_KEY = 'measurement';
export const PLANAR_FORM_NAME = [MEASUREMENT_GROUP_KEY, MEASUREMENT_KEYS.PLANAR];
export const LINEAR_FORM_NAME = [MEASUREMENT_GROUP_KEY, MEASUREMENT_KEYS.LINEAR];

// AddMeasurementModal
export const TOAST_OPTIONS = {duration: 1000, placement: 'top'};
export const PLANAR_COMPASS_FIELDS = ['strike', 'dip_direction', 'dip', 'quality', 'unix_timestamp'];
export const LINEAR_COMPASS_FIELDS = ['trend', 'plunge', 'rake', 'quality', 'unix_timestamp'];

// AddManualMeasurements keys
export const MANUAL_LABEL_KEY = 'label';
export const MANUAL_PLANAR_KEYS = ['strike', 'dip_direction', 'dip'];
export const MANUAL_LINEAR_KEYS = ['trend', 'plunge', 'rake'];
export const MANUAL_QUALITY_KEY = 'quality';
