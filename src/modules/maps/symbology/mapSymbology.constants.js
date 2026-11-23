export const MAP_SYMBOLS = {
  'default_point': require('../../../assets/symbols/point.png'),

  // Planar Feature Symbols
  'bedding_horizontal': require('../../../assets/symbols/bedding_horizontal.png'),
  'bedding_inclined': require('../../../assets/symbols/bedding_inclined.png'),
  'bedding_overturned': require('../../../assets/symbols/bedding_overturned.png'),
  'bedding_vertical': require('../../../assets/symbols/bedding_vertical.png'),
  'contact_inclined': require('../../../assets/symbols/contact_inclined.png'),
  'contact_vertical': require('../../../assets/symbols/contact_vertical.png'),
  'dike': require('../../../assets/symbols/dike.png'),
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

export const MAP_DEFAULT_COLOR = '#000000';  // Mapbox's default line-color and fill-color, which the map falls back to
export const MAP_DEFAULT_LINE_WIDTH = 1;     // Mapbox's default line-width, which the map falls back to

export const MAP_SYMBOL_IMAGE_SIZE = 180;   // Width and height in pixels of every image in MAP_SYMBOLS

// The part of each MAP_SYMBOLS image actually drawn on, as [left, top, right, bottom] pixel edges. A symbol is placed
// by its image's center, which its drawing is often not centered on: an inclined plane's dip tick sticks out to one
// side, and a lineation arrow runs up from the center. Measured from the non-transparent pixels; re-measure if an
// image changes.
export const MAP_SYMBOL_DRAWN_BOUNDS = {
  'default_point': [71, 72, 109, 110],
  'bedding_horizontal': [43, 43, 137, 137],
  'bedding_inclined': [87, 22, 113, 158],
  'bedding_overturned': [69, 21, 117, 157],
  'bedding_vertical': [75, 22, 105, 158],
  'contact_inclined': [77, 22, 118, 158],
  'contact_vertical': [75, 22, 105, 158],
  'dike': [88, 22, 92, 158],
  'fault': [87, 22, 134, 158],
  'foliation_horizontal': [43, 43, 137, 137],
  'foliation_inclined': [87, 22, 117, 159],
  'foliation_vertical': [63, 22, 117, 158],
  'fracture': [87, 22, 106, 158],
  'shear_zone_inclined': [80, 20, 113, 162],
  'shear_zone_vertical': [75, 19, 105, 162],
  'vein': [87, 22, 106, 158],
  'lineation_general': [79, 0, 101, 92],
  'starburst': [18, 15, 162, 164],
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
