export const MAP_SYMBOLS = {
  'default_point': require('../../../assets/symbols/point.png'),

  // Planar Feature Symbols
  'bedding_horizontal': require('../../../assets/symbols/bedding_horizontal.png'),
  'bedding_inclined': require('../../../assets/symbols/bedding_inclined.png'),
  'bedding_overturned': require('../../../assets/symbols/bedding_overturned.png'),
  'bedding_vertical': require('../../../assets/symbols/bedding_vertical.png'),
  'contact_inclined': require('../../../assets/symbols/contact_inclined.png'),
  'contact_vertical': require('../../../assets/symbols/contact_vertical.png'),
  'fault': require('../../../assets/symbols/fault.png'),
  'foliation_horizontal': require('../../../assets/symbols/foliation_horizontal.png'),
  'foliation_inclined': require('../../../assets/symbols/foliation_general_inclined.png'),
  'foliation_vertical': require('../../../assets/symbols/foliation_general_vertical.png'),
  'fracture': require('../../../assets/symbols/fracture.png'),
  'shear_zone_inclined': require('../../../assets/symbols/shear_zone_inclined.png'),
  'shear_zone_vertical': require('../../../assets/symbols/shear_zone_vertical.png'),
  'vein': require('../../../assets/symbols/vein.png'),

  // Old
  // 'axial_planar_inclined': require('../../assets/symbols/cleavage_inclined.png'),
  // 'axial_planar_vertical': require('../../assets/symbols/cleavage_vertical.png'),
  // 'joint_inclined': require('../../assets/symbols/joint_surface_inclined.png'),
  // 'joint_vertical': require('../../assets/symbols/joint_surface_vertical.png'),
  // 'shear_fracture': require('../../assets/symbols/shear_fracture.png'),

  // Linear Feature Symbols
  // 'fault': require('../../assets/symbols/fault_striation.png'),
  // 'flow': require('../../assets/symbols/flow.png'),
  // 'fold_hinge': require('../../assets/symbols/fold_axis.png'),
  // 'intersection': require('../../assets/symbols/intersection.png'),
  'lineation_general': require('../../../assets/symbols/lineation_general.png'),

  'starburst': require('../../../assets/symbols/starburst.png'),
};

export const LINE_PATTERNS = {
  solid: [1, 0],
  dotted: [0.5, 2],
  dashed: [5, 2],
  dotDashed: [5, 2, 0.5, 2],
};

export const LAYOUT_PROPERTIES_MAP = {
  iconAllowOverlap: 'icon-allow-overlap',
  iconIgnorePlacement: 'icon-ignore-placement',
  iconImage: 'icon-image',
  iconRotate: 'icon-rotate',
  iconSize: 'icon-size',
  symbolPlacement: 'symbol-placement',
  symbolSpacing: 'symbol-spacing',
  textAnchor: 'text-anchor',
  textField: 'text-field',
  textIgnorePlacement: 'text-ignore-placement',
  textOffset: 'text-offset',
  textRotate: 'text-rotate',
  textSize: 'text-size',
};

export const PAINT_PROPERTIES_MAP = {
  circleColor: 'circle-color',
  circleOpacity: 'circle-opacity',
  circleRadius: 'circle-radius',
  circleStrokeColor: 'circle-stroke-color',
  circleStrokeWidth: 'circle-stroke-width',
  fillColor: 'fill-color',
  fillOpacity: 'fill-opacity',
  fillOutlineColor: 'fill-outline-color',
  fillPattern: 'fill-pattern',
  lineColor: 'line-color',
  lineDasharray: 'line-dasharray',
  lineWidth: 'line-width',
};
