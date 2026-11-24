import {expression, latest} from 'mapbox-gl/dist/style-spec/index.cjs';

import {MAP_SYMBOL_DRAWN_BOUNDS, MAP_SYMBOLS} from './mapSymbology.constants';
import {
  getFrameProjection,
  getIconImage,
  getIconRotation,
  getLabel,
  getLabelOffset,
  getLabelOffsetX,
  getLabelText,
  getSymbolImageName,
  getSymbolRotation,
  getTurnedSymbolBounds,
  getUprightLine,
} from './mapSymbology.helpers';

// What the map itself draws: evaluate the Mapbox GL expression for a symbol layout property against a point feature.
// An expression that fails at runtime (comparing an empty field with a number) gives the property's default, as it
// does on the map.
const evaluateOnMap = (mapExpression, property, orientation, otherProperties = {}) => {
  const parsed = expression.createExpression(mapExpression, latest.layout_symbol[property]);
  if (parsed.result !== 'success') throw new Error(JSON.stringify(parsed.value));
  const properties = orientation ? {...otherProperties, orientation} : otherProperties;
  const value = parsed.value.evaluate({zoom: 0}, {properties, type: 'Point'});
  return ['icon-image', 'text-field'].includes(property) && value != null ? value.toString() : value;
};

const ORIENTATIONS = [
  undefined,
  {},
  {type: 'planar_orientation'},
  {type: 'planar_orientation', feature_type: 'bedding', strike: 30, dip: 0},
  {type: 'planar_orientation', feature_type: 'bedding', strike: 30, dip: 45},
  {type: 'planar_orientation', feature_type: 'bedding', strike: 30, dip: 90},
  {type: 'planar_orientation', feature_type: 'bedding', strike: 30, dip: 45, facing: 'overturned'},
  {type: 'planar_orientation', feature_type: 'bedding', strike: 30, dip: 95},
  {type: 'planar_orientation', feature_type: 'foliation', dip_direction: 45, dip: 0},
  {type: 'planar_orientation', feature_type: 'foliation', dip_direction: 200, dip: 60, facing: 'overturned'},
  {type: 'planar_orientation', feature_type: 'foliation', dip_direction: 10, dip: 90},
  {type: 'planar_orientation', feature_type: 'contact', strike: 120, dip: 0},
  {type: 'planar_orientation', feature_type: 'contact', strike: 120, dip: 30},
  {type: 'planar_orientation', feature_type: 'contact', strike: 120, dip: 90},
  {type: 'planar_orientation', feature_type: 'shear_zone', strike: 300, dip: 70},
  {type: 'planar_orientation', feature_type: 'shear_zone', strike: 300, dip: 90},
  {type: 'planar_orientation', feature_type: 'fault', strike: 15, dip: 60},
  {type: 'planar_orientation', feature_type: 'dike', strike: 15},
  {type: 'planar_orientation', feature_type: 'fracture', strike: 15, dip: 90},
  {type: 'planar_orientation', feature_type: 'vein', strike: 15, dip: 20},
  {type: 'planar_orientation', feature_type: 'joint', strike: 15, dip: 20},
  {type: 'linear_orientation', feature_type: 'fold_hinge', trend: 250, plunge: 20},
  {type: 'linear_orientation', trend: 250, plunge: 0},
  {type: 'linear_orientation', feature_type: 'bedding', trend: 80, plunge: 30},
  {type: 'linear_orientation'},
  // Fields present but empty, which the map's `has` counts as present
  {type: 'planar_orientation', feature_type: 'bedding', strike: null, dip_direction: 200, dip: 30},
  {type: 'planar_orientation', feature_type: 'bedding', strike: 30, dip: null, plunge: 0},
  {type: 'planar_orientation', feature_type: 'bedding', strike: 30, dip: null},
  {type: 'planar_orientation', feature_type: 'foliation', strike: 30, dip: 0, facing: null},
  {type: 'linear_orientation', trend: null, plunge: null},
  {type: 'linear_orientation', dip_direction: null, trend: 40, plunge: 10},
];
const ORIENTATION_CASES = ORIENTATIONS.map(orientation => [JSON.stringify(orientation), orientation]);

describe('getSymbolImageName', () => {
  it.each(ORIENTATION_CASES)(
    'picks the image the map draws for %s', (label, orientation) => {
      expect(getSymbolImageName(orientation)).toBe(evaluateOnMap(getIconImage(), 'icon-image', orientation));
    });
});

describe('getSymbolRotation', () => {
  it.each(ORIENTATION_CASES)(
    'turns the symbol as the map does for %s', (label, orientation) => {
      expect(getSymbolRotation(orientation)).toBe(evaluateOnMap(getIconRotation(), 'icon-rotate', orientation));
    });
});

describe('getFrameProjection', () => {
  // A 10 x 5 box fitted into 46 px with 4 px padding scales by 38 / 10
  const toFrame = getFrameProjection([100, 200, 110, 205], 46, 4);

  it('fits the widest side inside the padding, centered', () => {
    expect(toFrame([100, 200])).toEqual([4, 32.5]);
    expect(toFrame([110, 205])).toEqual([42, 13.5]);
  });

  it('turns y to run down the screen', () => {
    expect(toFrame([105, 205])[1]).toBeLessThan(toFrame([105, 200])[1]);
  });

  it('puts a shape with no size at the center', () => {
    expect(getFrameProjection([100, 200, 100, 200], 46, 4)([100, 200])).toEqual([23, 23]);
  });
});

describe('getUprightLine', () => {
  it('keeps a line that reads left to right', () => {
    expect(getUprightLine([[0, 0], [5, 9], [10, 2]])).toEqual([[0, 0], [5, 9], [10, 2]]);
  });

  it('reverses a line that reads right to left', () => {
    expect(getUprightLine([[10, 2], [5, 9], [0, 0]])).toEqual([[0, 0], [5, 9], [10, 2]]);
  });
});

describe('getTurnedSymbolBounds', () => {
  it('has the drawn bounds of every symbol image', () => {
    expect(Object.keys(MAP_SYMBOL_DRAWN_BOUNDS).sort()).toEqual(Object.keys(MAP_SYMBOLS).sort());
  });

  // The lineation arrow runs up from where it is placed, from 90 px above it to 2 px below. Bounds are
  // [left, top, right, bottom].
  it.each([
    [0, [-11, -90, 11, 2]],
    [90, [-2, -11, 90, 11]],
    [180, [-11, -2, 11, 90]],
    [270, [-90, -11, 2, 11]],
  ])('turns a lineation arrow by %i degrees clockwise', (rotation, expected) => {
    const bounds = getTurnedSymbolBounds('lineation_general', rotation);
    expected.forEach((edge, index) => expect(bounds[index]).toBeCloseTo(edge));
  });
});

describe('getLabelText', () => {
  const LABEL_CASES = [undefined, 'name', 'dip', 'dipOrName'].flatMap(labelTypeOn => [
    {name: 'S1'},
    {isSpotNameLabelHidden: true, name: 'S1'},
  ].flatMap(otherProperties => ORIENTATIONS.map(orientation => [
    JSON.stringify({labelTypeOn, ...otherProperties, orientation}), labelTypeOn, otherProperties, orientation,
  ])));

  it.each(LABEL_CASES)('labels the symbol as the map does for %s', (label, labelTypeOn, otherProperties, orientation) => {
    const properties = orientation ? {...otherProperties, orientation} : otherProperties;
    expect(String(getLabelText(properties, labelTypeOn) ?? ''))
      .toBe(evaluateOnMap(getLabel(labelTypeOn), 'text-field', orientation, otherProperties));
  });
});

describe('getLabelOffsetX', () => {
  it.each(ORIENTATION_CASES)(
    'offsets the label as the map does for %s', (label, orientation) => {
      expect([getLabelOffsetX(orientation), 0]).toEqual(evaluateOnMap(getLabelOffset(), 'text-offset', orientation));
    });
});
