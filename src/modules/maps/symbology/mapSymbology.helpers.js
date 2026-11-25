import {MAP_SYMBOL_DRAWN_BOUNDS, MAP_SYMBOL_IMAGE_SIZE} from './mapSymbology.constants';

// Get the image for the symbol (Mapbox GL expression). Keep getSymbolImageName in step with it.
export const getIconImage = () => {
  return ['case', ['has', 'orientation'],
    // Variable bindings
    ['let',
      'symbol_orientation',
      ['case',
        ['has', 'dip', ['get', 'orientation']], ['get', 'dip', ['get', 'orientation']],
        ['case',
          ['has', 'plunge', ['get', 'orientation']], ['get', 'plunge', ['get', 'orientation']],
          0,
        ],
      ],
      ['let',
        'feature_type',
        ['get', 'feature_type', ['get', 'orientation']],

        // Output
        ['case',
          // Case 1: Orientation has facing
          ['all',
            ['==', ['get', 'facing', ['get', 'orientation']], 'overturned'],
            ['any',
              ['==', ['var', 'feature_type'], 'bedding'],
            ],
          ], ['concat', ['get', 'feature_type', ['get', 'orientation']], '_overturned'],
          ['case',
            // Case 2: Symbol orientation is 0 and feature type is bedding or foliation
            ['all',
              ['==', ['var', 'symbol_orientation'], 0],
              ['any',
                ['==', ['var', 'feature_type'], 'bedding'], ['==', ['var', 'feature_type'], 'foliation'],
              ],
            ], ['concat', ['var', 'feature_type'], '_horizontal'],
            ['case',
              // Case 3: Symbol orientation between 0-90 and feature type is bedding, contact, foliation or shear zone
              ['all',
                ['>', ['var', 'symbol_orientation'], 0],
                ['<', ['var', 'symbol_orientation'], 90],
                ['any',
                  ['==', ['var', 'feature_type'], 'bedding'], ['==', ['var', 'feature_type'], 'contact'],
                  ['==', ['var', 'feature_type'], 'foliation'], ['==', ['var', 'feature_type'], 'shear_zone'],
                ],
              ], ['concat', ['var', 'feature_type'], '_inclined'],
              ['case',
                // Case 4: Symbol orientation is 90 and feature type is bedding, contact, foliation or shear zone
                ['all',
                  ['==', ['var', 'symbol_orientation'], 90],
                  ['any',
                    ['==', ['var', 'feature_type'], 'bedding'], ['==', ['var', 'feature_type'], 'contact'],
                    ['==', ['var', 'feature_type'], 'foliation'], ['==', ['var', 'feature_type'], 'shear_zone'],
                  ],
                ], ['concat', ['var', 'feature_type'], '_vertical'],
                ['case',
                  // Case 5: Other features with no symbol orientation
                  ['all',
                    ['has', 'feature_type', ['get', 'orientation']],
                    ['any',
                      ['==', ['var', 'feature_type'], 'dike'], ['==', ['var', 'feature_type'], 'fault'],
                      ['==', ['var', 'feature_type'], 'fracture'], ['==', ['var', 'feature_type'], 'vein'],
                    ],
                  ], ['get', 'feature_type', ['get', 'orientation']],
                  ['case',
                    // Defaults
                    ['==', ['get', 'type', ['get', 'orientation']], 'linear_orientation'], 'lineation_general',
                    'default_point',
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
    ],
    'default_point',
  ];
};

// Get the rotation of the symbol, either strike, trend or failing both, 0 (Mapbox GL expression). Keep
// getSymbolRotation in step with it.
export const getIconRotation = () => {
  return [
    'case', ['has', 'orientation'],
    ['case',
      ['has', 'strike', ['get', 'orientation']], ['get', 'strike', ['get', 'orientation']],
      ['case',
        ['has', 'dip_direction', ['get', 'orientation']], ['%', ['-', ['get', 'dip_direction', ['get', 'orientation']], 90], 360],
        ['case',
          ['has', 'trend', ['get', 'orientation']], ['get', 'trend', ['get', 'orientation']],
          0,
        ],
      ],
    ],
    0,
  ];
};

// The plain-JS copies of the expressions below follow the map on empty fields too: the map's `has` counts a field
// that is there but empty, its `get` then gives null, and an expression that fails on that null falls back to the
// property's default.

// The symbol image getIconImage picks for a point feature's orientation, for drawing it outside the map. Null when
// the map draws no symbol: an empty dip or plunge fails the expression.
export const getSymbolImageName = (orientation) => {
  if (!orientation) return 'default_point';
  const featureType = orientation.feature_type;
  const symbolOrientation = 'dip' in orientation ? orientation.dip
    : 'plunge' in orientation ? orientation.plunge : 0;
  const isPlanarType = ['bedding', 'contact', 'foliation', 'shear_zone'].includes(featureType);

  if (orientation.facing === 'overturned' && featureType === 'bedding') return featureType + '_overturned';
  if (symbolOrientation === 0 && ['bedding', 'foliation'].includes(featureType)) return featureType + '_horizontal';
  if (typeof symbolOrientation !== 'number') return null;
  if (symbolOrientation > 0 && symbolOrientation < 90 && isPlanarType) return featureType + '_inclined';
  if (symbolOrientation === 90 && isPlanarType) return featureType + '_vertical';
  if (['dike', 'fault', 'fracture', 'vein'].includes(featureType)) return featureType;
  if (orientation.type === 'linear_orientation') return 'lineation_general';
  return 'default_point';
};

// The value getIconRotation works out, which is null when the field it reads is empty
const getRotationValue = (orientation) => {
  if (!orientation) return 0;
  if ('strike' in orientation) return orientation.strike;
  if ('dip_direction' in orientation) {
    return typeof orientation.dip_direction === 'number' ? (orientation.dip_direction - 90) % 360 : null;
  }
  if ('trend' in orientation) return orientation.trend;
  return 0;
};

// The rotation getIconRotation gives a point feature's orientation, for drawing it outside the map
export const getSymbolRotation = (orientation) => {
  const rotation = getRotationValue(orientation);
  return typeof rotation === 'number' ? rotation : 0;
};

// A function placing [x, y] map positions in a square frame of the given size: the [minX, minY, maxX, maxY] box
// fitted inside the padding and centered, and y turned to run down the screen. A shape with no size sits at the center.
export const getFrameProjection = ([minX, minY, maxX, maxY], frameSize, padding) => {
  const extent = Math.max(maxX - minX, maxY - minY);
  const scale = extent > 0 ? (frameSize - 2 * padding) / extent : 1;
  return ([x, y]) => [
    frameSize / 2 + (x - (minX + maxX) / 2) * scale,
    frameSize / 2 - (y - (minY + maxY) / 2) * scale,
  ];
};

// The box a symbol image's drawing covers once turned, as [left, top, right, bottom] in image pixels from the point
// the symbol is placed at
export const getTurnedSymbolBounds = (imageName, rotation) => {
  const [left, top, right, bottom] = MAP_SYMBOL_DRAWN_BOUNDS[imageName];
  const center = MAP_SYMBOL_IMAGE_SIZE / 2;
  const radians = rotation * Math.PI / 180;
  const corners = [[left, top], [right, top], [right, bottom], [left, bottom]].map(([x, y]) => [
    (x - center) * Math.cos(radians) - (y - center) * Math.sin(radians),
    (x - center) * Math.sin(radians) + (y - center) * Math.cos(radians),
  ]);
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

// Get the label (Mapbox GL expression). Keep getLabelText in step with it.
export const getLabel = (labelTypeOn) => {
  // A Spot with multiple measurements is drawn as a feature per measurement, all at the same place, so only the
  // feature marked to carry the Spot name labels it (see hideRepeatedSpotNameLabels in useMapFeatures)
  if (labelTypeOn === 'name') return ['case', ['has', 'isSpotNameLabelHidden'], '', ['get', 'name']];
  else if (labelTypeOn === 'dip') {
    return [
      'case', ['has', 'orientation'],
      ['case',
        ['has', 'plunge', ['get', 'orientation']], ['get', 'plunge', ['get', 'orientation']],
        ['case',
          ['has', 'dip', ['get', 'orientation']], ['get', 'dip', ['get', 'orientation']],
          '',
        ],
      ],
      '',
    ];
  }
  else if (labelTypeOn === 'dipOrName') {
    return [
      'case', ['has', 'orientation'],
      ['case',
        ['has', 'plunge', ['get', 'orientation']], ['get', 'plunge', ['get', 'orientation']],
        ['case',
          ['has', 'dip', ['get', 'orientation']], ['get', 'dip', ['get', 'orientation']],
          ['get', 'name'],
        ],
      ],
      ['get', 'name'],
    ];
  }
  else return '';

  // Does not work on iOS - iOS doesn't build if there is more than 1 condition and a fallback in a case expression
  /*return ['case', ['has', 'orientation'],
   ['case',
   ['has', 'dip', ['get', 'orientation']], ['get', 'dip', ['get', 'orientation']],
   ['has', 'plunge', ['get', 'orientation']], ['get', 'plunge', ['get', 'orientation']],
   ['get', 'name'],
   ],
   ['get', 'name'],
   ];*/
};

// The label getLabel gives a point feature, for drawing it outside the map. Null when the field it reads is empty,
// which the map draws as no label.
export const getLabelText = (properties, labelTypeOn) => {
  const orientation = properties.orientation;
  const hasOrientationValue = !!orientation && ('plunge' in orientation || 'dip' in orientation);
  const orientationValue = hasOrientationValue && ('plunge' in orientation ? orientation.plunge : orientation.dip);
  if (labelTypeOn === 'name') return 'isSpotNameLabelHidden' in properties ? '' : properties.name;
  if (labelTypeOn === 'dip') return hasOrientationValue ? orientationValue : '';
  if (labelTypeOn === 'dipOrName') return hasOrientationValue ? orientationValue : properties.name;
  return '';
};

// Get the label offset, which is further to the right if the symbol rotation is between 60-120 or 240-300
// (Mapbox GL expression). Keep getLabelOffsetX in step with it.
export const getLabelOffset = () => {
  return ['case', ['has', 'orientation'],
    // Variable bindings
    ['let',
      'rotation',
      ['case',
        ['has', 'strike', ['get', 'orientation']], ['get', 'strike', ['get', 'orientation']],
        ['case',
          ['has', 'dip_direction', ['get', 'orientation']], ['%', ['-', ['get', 'dip_direction', ['get', 'orientation']], 90], 360],
          ['case',
            ['has', 'trend', ['get', 'orientation']], ['get', 'trend', ['get', 'orientation']],
            0,
          ],
        ],
      ],

      // Output
      ['case',
        // Symbol rotation between 60-120 or 240-300
        ['any',
          ['all',
            ['>=', ['var', 'rotation'], 60],
            ['<=', ['var', 'rotation'], 120],
          ],
          ['all',
            ['>=', ['var', 'rotation'], 240],
            ['<=', ['var', 'rotation'], 300],
          ],
        ], ['literal', [2, 0]],     // Need to specify 'literal' to return an array in expressions
        // Default
        ['literal', [0.75, 0]],
      ],
    ],
    ['literal', [0.75, 0]],
  ];
};

// A line's points in the direction its label reads, as the map keeps line labels upright: left to right
export const getUprightLine = points => points[points.length - 1][0] < points[0][0] ? [...points].reverse() : points;

// The horizontal label offset, in ems, getLabelOffset gives a point feature, for drawing it outside the map. None
// when the rotation it reads is empty, which fails the expression.
export const getLabelOffsetX = (orientation) => {
  if (typeof getRotationValue(orientation) !== 'number') return 0;
  return isLabelOffsetFurtherRight(orientation) ? 2 : 0.75;
};

// The rule getLabelOffset applies, in plain JS: the label sits further to the right of a symbol rotated between
// 60-120 or 240-300, which takes up more horizontal space
export const isLabelOffsetFurtherRight = (orientation) => {
  const rotation = getSymbolRotation(orientation);
  return (rotation >= 60 && rotation <= 120) || (rotation >= 240 && rotation <= 300);
};
