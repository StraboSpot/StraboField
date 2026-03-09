export const DEFAULT_FABRIC_TYPE = 'fault_rock';
export const DEPRECATED_FABRIC_GROUP_KEY = '_3d_structures';
export const DEPRECATED_FABRIC_TYPE = 'fabric';
export const FABRICS_GROUP_KEY = 'fabrics';

export const FABRIC_TYPES = {
  fault_rock: 'Structural',
  igneous_rock: 'Igneous',
  metamorphic_rock: 'Metam.',
};

export const ADD_FABRIC_FIELDS = {
  fault_rock: ['structural_fabric', 'linear_structural_fabrics', 'spatial_config', 'kinematic_fab'],
  igneous_rock: ['planar_fab', 'lin_fab', 'magmatic_str', 'mag_kin_fab'],
  metamorphic_rock: ['planar_fabric', 'linear_fab', 'other_met_fab', 'kinematic_fab'],
};

export const ADD_FABRIC_KEYS = {
  fault_rock: {firstKeys: ['label'], lastKeys: ['interp_note'], tectoniteTypesKey: 'tectonite_type'},
  igneous_rock: {firstKeys: ['label'], lastKeys: ['mag_interp_note']},
  metamorphic_rock: {firstKeys: ['label'], lastKeys: ['interp_note_meta'], tectoniteTypesKey: 'tectonite_type'},
};

export const FABRIC_SECTIONS_TITLES = {
  fault_rock: 'Structural Fabrics',
  igneous_rock: 'Igneous Fabrics',
  metamorphic_rock: 'Metamorphic Fabrics',
  deprecated: 'Fabrics (Deprecated Version)',
};
