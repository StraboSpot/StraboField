import {getOrientationFields} from '../compass/compass.helpers';

export const THREE_D_STRUCTURE_SECTIONS = {
  // FABRICS: {title: 'Fabrics', key: 'fabric'}, // Hidden here and displayed on Fabrics page as deprecated
  FOLDS: {title: 'Folds', key: 'fold'},
  FAULTS: {title: 'Faults', key: 'fault'},
  TENSORS: {title: 'Tensors', key: 'tensor'},
  OTHER: {title: 'Other', key: 'other'},
};

export const THREE_D_STRUCTURE_TYPES = {
  FOLD: 'fold',
  FAULT: 'fault',
  TENSOR: 'tensor',
  OTHER: 'other',
};

export const FOLD_MEASUREMENTS_KEYS = {
  group_xf0sv21: {
    trend: 'Trend',
    plunge: 'Plunge',
    quality: 'Measurement_Quality',
  },
  group_kx3ya56: {
    strike: 'Strike',
    dip_direction: 'Azimuthal_Dip_Direction',
    dip: 'Dip',
    quality: 'Measurement_Quality_001',
  },
  group_fold_foliation: {
    strike: 'fold_fol_strike',
    dip_direction: 'fold_fol_dip_direction',
    dip: 'fold_fol_dip',
    quality: 'fold_fol_quality',
  },
};

export const FAULT_MEASUREMENTS_KEYS = {
  group_ov4gw94: {
    strike: 'strike',
    dip_direction: 'dip_direction',
    dip: 'dip',
    quality: 'quality',
  },
};

export const BOUDINAGE_MEASUREMENTS_KEYS = {
  group_boudin_plane: {
    strike: 'boudinage_strike',
    dip_direction: 'boudinage_dip_direction',
    dip: 'boudinage_dip',
  },
  group_primary_neckline: {
    trend: 'boudinage_trend',
    plunge: 'boudinage_plunge',
  },
  group_secondary_neckline: {
    trend: 'boudinage_2nd_trend',
    plunge: 'boudinage_2nd_plunge',
  },
};

export const MULLION_MEASUREMENTS_KEYS = {
  group_ao6yo60: {
    strike: 'mullion_strike',
    dip_direction: 'mullion_dip_direction',
    dip: 'mullion_dip',
  },
  group_db5vg51: {
    trend: 'mullion_trend',
    plunge: 'mullion_plunge',
    quality: 'mullion_linear_measure_quality',
  },
};

// Every group above that describes a plane, plus the tensor's elliptical fields, which are typed straight into
// the form and so have no group of their own. Entering either field of a pair can fill in the other.
export const THREE_D_STRUCTURE_ORIENTATION_FIELDS = getOrientationFields({
  ...FOLD_MEASUREMENTS_KEYS,
  ...FAULT_MEASUREMENTS_KEYS,
  ...BOUDINAGE_MEASUREMENTS_KEYS,
  ...MULLION_MEASUREMENTS_KEYS,
  group_elliptical: {strike: 'elliptical_strike', dip_direction: 'elliptical_dip_direction'},
});

// AddFault keys
export const ADD_FAULT_FIRST_KEYS = ['label'];
export const ADD_FAULT_MAIN_BUTTONS_KEYS = ['fault_or_sz_type'];
export const ADD_FAULT_SECOND_BUTTON_KEYS = ['movement', 'movement_justification', 'directional_indicators'];
export const ADD_FAULT_LAST_KEYS = ['movement_amount_m', 'amplitude_m', 'folded_layer_thickness_m', 'fault_notes'];

// AddFold keys
export const ADD_FOLD_FIRST_KEYS = ['label'];
export const ADD_FOLD_MAIN_BUTTONS_KEYS = ['feature_type'];
export const ADD_FOLD_TIGHTNESS_KEY = 'tightness';
export const ADD_FOLD_VERGENCE_KEY = 'vergence';
export const ADD_FOLD_LAST_KEYS = ['fold_notes'];

// AddOther keys
export const ADD_OTHER_LABEL_KEY = ['label'];
export const ADD_OTHER_FIRST_KEYS = ['feature_type'];
export const ADD_OTHER_BOUDINAGE_FIRST_KEYS = ['boudinage_geometry', 'boudinage_shape'];
export const ADD_OTHER_BOUDINAGE_THIRD_KEYS = ['boudinage_competent', 'boudinage_incompetent', 'average_width_of_boudin_neck',
  'number_of_necks_measured', 'boudinage_wavelength_m', 'boudinaged_layer_thickness_m'];
export const ADD_OTHER_MULLION_FIRST_KEYS = ['mullion_geometry', 'mullion_symmetry'];
export const ADD_OTHER_MULLION_THIRD_KEYS = ['mullion_competent_material', 'mullion_incompetent_material', 'mullion_wavelength_m',
  'mullion_layer_thickness_m'];
export const ADD_OTHER_LOBATE_CUSPATE_KEYS = ['approximate_scale_m_lobate', 'lobate_competent_material', 'lobate_incompetent_material'];
export const ADD_OTHER_LAST_KEYS = ['struct_notes'];
