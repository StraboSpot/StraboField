// Get the image for the symbol (Mapbox GL expression)
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
                      ['==', ['var', 'feature_type'], 'fault'], ['==', ['var', 'feature_type'], 'fracture'],
                      ['==', ['var', 'feature_type'], 'vein'],
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

// Get the rotation of the symbol, either strike, trend or failing both, 0 (Mapbox GL expression)
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

// Get the label (Mapbox GL expression)
export const getLabel = (labelTypeOn) => {
  if (labelTypeOn === 'name') return ['get', 'name'];
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

// Get the label offset, which is further to the right if the symbol rotation is between 60-120 or 240-300
// (Mapbox GL expression)
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
