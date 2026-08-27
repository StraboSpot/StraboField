export const ROCK_SECOND_ORDER_TYPE_FIELDS = [
  'siliciclastic_type',
  'dunham_classification',
  'evaporite_type',
  'organic_coal_lithologies',
  'volcaniclastic_type',
  'phosphorite_type',
];

// The interval characters whose lithologies have to be filled in
export const LITHOLOGY_INTERVAL_CHARACTERS = ['bed', 'bed_mixed_lit', 'interbedded', 'package_succe'];

export const LITHOLOGY_SUBPAGES = {
  LITHOLOGY: 'lithology',
  COMPOSITION: 'composition',
  TEXTURE: 'texture',
  STRATIFICATION: 'stratification',
};

export const STRUCTURE_SUBPAGES = {
  BEDDING_PLANE: 'bedding_plane',
  BIOTURBATION: 'bioturbation',
  PEDOGENIC: 'pedogenic',
  PHYSICAL: 'physical',
};

export const INTERPRETATIONS_SUBPAGES = {
  ARCHITECTURE: 'architecture',
  ENVIRONMENT: 'environment',
  PROCESS: 'process',
  SURFACES: 'surfaces',
};

export const INTERVAL_FIELDS = ['character', 'interval_thickness', 'thickness_units'];

export const LITHOLOGIES_FIELDS = [
  'primary_lithology', 'siliciclastic_type', 'mud_silt_grain_size', 'sand_grain_size',
  'congl_grain_size', 'breccia_grain_size', 'dunham_classification', 'relative_resistance_weather',
];

export const BEDDING_FIELDS = [
  'interbed_proportion_change', 'interbed_proportion', 'lithology_at_bottom_contact',
  'lithology_at_top_contact', 'thickness_of_individual_beds', 'avg_thickness', 'max_thickness',
  'min_thickness',
];

export const X_INTERVAL = 10;  // Horizontal spacing between grain sizes/weathering tick marks

export const Y_MULTIPLIER = 20;  // 1 m interval thickness = 20 pixels
