import {useSelector} from 'react-redux';

import {hexToRgb, isEmpty} from '../../../shared/Helpers';
import {MEDIUMGREY} from '../../../shared/styles.constants';
import {useTags} from '../../tags';
import useStratSectionSymbology from '../strat-section/useStratSectionSymbology';

const useMapSymbology = () => {
  const {getStratIntervalFill} = useStratSectionSymbology();
  const {getTagsAtSpot} = useTags();

  const tagTypeForColor = useSelector(state => state.map.tagTypeForColor);
  const labelTypeOn = useSelector(state => state.map.labelTypeOn);

  const linePatterns = {
    solid: [1, 0],
    dotted: [0.5, 2],
    dashed: [5, 2],
    dotDashed: [5, 2, 0.5, 2],
  };

  const mapStyles = {
    point: {
      textIgnorePlacement: true,  // Need to be able to stack symbols at same location
      textField: getLabel(),
      textAnchor: 'left',
      textOffset: getLabelOffset(),
      iconImage: getIconImage(),
      iconRotate: getIconRotation(),
      iconAllowOverlap: true,     // Need to be able to stack symbols at same location
      iconIgnorePlacement: true,  // Need to be able to stack symbols at same location
      iconSize: 0.35,
      // symbolSpacing: 0,
    },
    pointColorHalo: {
      circleRadius: 17,
      circleColor: ['get', 'circleColor', ['get', 'symbology']],
    },
    lineLabel: {
      textField: getLabel(),
      symbolPlacement: 'line',
      textAnchor: 'bottom',
    },
    line: {
      lineColor: ['get', 'lineColor', ['get', 'symbology']],
      lineWidth: ['get', 'lineWidth', ['get', 'symbology']],
    },
    lineDotted: {
      lineColor: ['get', 'lineColor', ['get', 'symbology']],
      lineWidth: ['get', 'lineWidth', ['get', 'symbology']],
      lineDasharray: linePatterns.dotted,   // Can't use data-driven styling with line-dasharray - it is not supported
                                            // Used filters on the line layers instead
                                            // https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#paint-line-line-dasharray
    },
    lineDashed: {
      lineColor: ['get', 'lineColor', ['get', 'symbology']],
      lineWidth: ['get', 'lineWidth', ['get', 'symbology']],
      lineDasharray: linePatterns.dashed,
    },
    lineDotDashed: {
      lineColor: ['get', 'lineColor', ['get', 'symbology']],
      lineWidth: ['get', 'lineWidth', ['get', 'symbology']],
      lineDasharray: linePatterns.dotDashed,
    },
    polygonLabel: {
      textField: getLabel(),
    },
    polygon: {
      fillColor: ['get', 'fillColor', ['get', 'symbology']],
      fillOutlineColor: 'black',
    },
    polygonWithPattern: {
      fillPattern: ['get', 'fillPattern', ['get', 'symbology']],
      fillOutlineColor: 'black',
    },
    pointSelected: {
      circleRadius: 35,
      circleColor: 'orange',
      circleOpacity: 0.4,
    },
    lineSelected: {
      lineColor: 'orange',
      lineWidth: ['get', 'lineWidth', ['get', 'symbology']],
    },
    lineSelectedDotted: {
      lineColor: 'orange',
      lineWidth: ['get', 'lineWidth', ['get', 'symbology']],
      lineDasharray: linePatterns.dotted,
    },
    lineSelectedDashed: {
      lineColor: 'orange',
      lineWidth: ['get', 'lineWidth', ['get', 'symbology']],
      lineDasharray: linePatterns.dashed,
    },
    lineSelectedDotDashed: {
      lineColor: 'orange',
      lineWidth: ['get', 'lineWidth', ['get', 'symbology']],
      lineDasharray: linePatterns.dotDashed,
    },
    polygonSelected: {
      fillColor: 'orange',
      fillOpacity: 0.7,
    },
    polygonWithPatternSelected: {
      fillColor: 'orange',
      fillPattern: ['get', 'fillPattern', ['get', 'symbology']],
      fillOpacity: 0.7,
    },
    pointDraw: {
      circleRadius: 5,
      circleColor: 'orange',
      circleStrokeColor: 'white',
      circleStrokeWidth: 2,
    },
    lineDraw: {
      lineColor: 'orange',
      lineWidth: 3,
      lineDasharray: [2, 2],
    },
    polygonDraw: {
      fillColor: 'orange',
      fillOpacity: 0.4,
    },
    pointEdit: {
      circleRadius: 10,
      circleColor: 'orange',
      circleStrokeColor: 'white',
      circleStrokeWidth: 2,
    },
    pointMeasure: {
      circleRadius: 5,
      circleColor: 'black',
    },
    lineMeasure: {
      lineColor: 'black',
      lineWidth: 3,
    },
    sample: {
      textIgnorePlacement: true,  // Need to be able to stack symbols at same location
      iconImage: 'starburst',
      iconAllowOverlap: true,     // Need to be able to stack symbols at same location
      iconIgnorePlacement: true,  // Need to be able to stack symbols at same location
      iconSize: 0.2,
    },
    xAxisTickMarkLabels: {
      textField: ['get', 'label'],
      textAnchor: 'bottom-left',
      textOffset: [1, 1],
      textRotate: 45,
      textIgnorePlacement: true,
      textSize: 10,
    },
    yAxisTickMarkLabels: {
      textField: ['get', 'label'],
      textAnchor: 'bottom',
      textOffset: [-1, 0],
      textIgnorePlacement: true,
      textSize: 10,
    },
    pointCircleReadOnly: {
      circleRadius: 6,
      circleColor: MEDIUMGREY,
    },
    polygonReadOnly: {
      fillColor: MEDIUMGREY,
      fillOpacity: 0.7,
    },
    lineReadOnly: {
      lineColor: MEDIUMGREY,
      lineWidth: 3,
    },
  };

  /* Internal Functions */

  // Get the image for the symbol
  function getIconImage() {
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
  }

  // Get the rotation of the symbol, either strike, trend or failing both, 0
  function getIconRotation() {
    return [
      'case',
      ['has', 'strike', ['get', 'orientation']], ['get', 'strike', ['get', 'orientation']],
      ['case',
        ['has', 'dip_direction', ['get', 'orientation']], ['%', ['-', ['get', 'dip_direction', ['get', 'orientation']], 90], 360],
        ['case',
          ['has', 'trend', ['get', 'orientation']], ['get', 'trend', ['get', 'orientation']],
          0,
        ],
      ],
    ];
  }

  // Get the label
  function getLabel() {
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
  }

  // Get the label offset, which is further to the right if the symbol rotation is between 60-120 or 240-300
  function getLabelOffset() {
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
  }

  const getLineSymbology = (feature) => {
    let color = '#663300';
    let width = 2;
    let lineDash = linePatterns.solid;

    if (feature.properties.trace) {
      const trace = feature.properties.trace;

      // Set line color and weight
      switch (trace.trace_type) {
        case 'geologic_struc':
          color = '#FF0000';
          if (trace.geologic_structure_type
            && (trace.geologic_structure_type === 'fault' || trace.geologic_structure_type === 'shear_zone')) {
            width = 4;
          }
          break;
        case 'contact':
          color = '#000000';
          if (trace.contact_type && trace.contact_type === 'intrusive'
            && trace.intrusive_contact_type && trace.intrusive_contact_type === 'dike') {
            width = 4;
          }
          break;
        case 'geomorphic_fea':
          color = '#0000FF';
          width = 4;
          break;
        case 'anthropenic_fe':
          color = '#800080';
          width = 4;
          break;
      }

      // Set line pattern
      lineDash = linePatterns.dotted;
      switch (trace.trace_quality) {
        case 'known':
          lineDash = linePatterns.solid;
          break;
        case 'approximate':
        case 'approximate(?)':
          lineDash = linePatterns.dashed;
          break;
        case 'other':
          lineDash = linePatterns.dotDashed;
          break;
      }
    }

    return {
      'lineColor': getTagColor(feature) || color,
      'lineWidth': width,
      'lineDasharray': lineDash,
    };
  };

  const getPointSymbology = (feature) => {
    return {
      'circleColor': getTagColor(feature) || 'transparent',
    };
  };

  const getPolygonSymbology = (feature) => {
    if (feature.properties.surface_feature && feature.properties.surface_feature.surface_feature_type === 'strat_interval') {
      return getStratIntervalFill(feature.properties);
    }
    else {
      let color = 'rgba(0, 0, 255, 0.4)';     // default fill color
      const tagColor = getTagColor(feature);
      if (tagColor) color = tagColor;
      // If feature has a surface feature type apply the specified color
      else if (feature.properties.surface_feature && feature.properties.surface_feature.surface_feature_type) {
        switch (feature.properties.surface_feature.surface_feature_type) {
          case 'rock_unit':
            color = 'rgba(0, 255, 255, 0.4)';   // light blue
            break;
          case 'contiguous_outcrop':
            color = 'rgba(240, 128, 128, 0.4)'; // pink
            break;
          case 'geologic_structure':
            color = 'rgba(0, 255, 255, 0.4)';   // light blue
            break;
          case 'geomorphic_feature':
            color = 'rgba(0, 128, 0, 0.4)';     // green
            break;
          case 'anthropogenic_feature':
            color = 'rgba(128, 0, 128, 0.4)';   // purple
            break;
          case 'extent_of_mapping':
            color = 'rgba(128, 0, 128, 0)';     // no fill
            break;
          case 'extent_of_biological_marker':   // green
            color = 'rgba(0, 128, 0, 0.4)';
            break;
          case 'subjected_to_similar_process':
            color = 'rgba(255, 165, 0,0.4)';    // orange
            break;
          case 'gradients':
            color = 'rgba(255, 165, 0,0.4)';    // orange
            break;
        }
      }
      return {
        fillColor: color,
      };
    }
  };

  // If feature has a tag of the type specified in the Map Symbols dialog (geologic unit or concept)
  // and that tag has a color assigned to then apply that color first
  const getTagColor = (feature) => {
    let color;
    let tagsAtSpot = getTagsAtSpot(feature.properties.id);
    const tagsForColor = tagsAtSpot.filter(tag => tag.type === tagTypeForColor);
    if (!isEmpty(tagsForColor) && tagsForColor[0].color) {
      const rgbColor = hexToRgb(tagsForColor[0].color);
      color = 'rgba(' + rgbColor.r + ', ' + rgbColor.g + ', ' + rgbColor.b + ', 0.4)';
    }
    return color;
  };

  /* Exported Functions */

  // Add symbology to properties of map features (not to Spots themselves) since data-driven styling
  // doesn't work for colors by tags and more complex styling
  const addSymbology = (features) => {
    return features.map((feature) => {
      const symbology = getSymbology(feature);
      if (!isEmpty(symbology)) feature.properties.symbology = symbology;
      return feature;
    });
  };

  const getLayoutSymbology = () => {
    // Map of properties for native to web
    const layoutPropertiesMap = {
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

    return Object.entries(mapStyles).reduce((acc, [key, value]) => ({
      ...acc,
      ...{
        [key]: Object.entries(value).reduce((acc2, [property, style]) => {
            return layoutPropertiesMap[property] ? {...acc2, ...{[layoutPropertiesMap[property]]: style}} : acc2;
          },
          {}),
      },
    }), {});
  };

  const getLinesFilteredByPattern = (pattern) => {
    return (
      ['all',
        ['==', ['geometry-type'], 'LineString'],
        ['==', ['to-string', ['get', 'lineDasharray', ['get', 'symbology']]], ['to-string', ['literal', linePatterns[pattern]]]],
      ]
    );
  };

  const getMapSymbology = () => mapStyles;

  const getPaintSymbology = () => {
    // Map of properties for native to web
    const paintPropertiesMap = {
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
    return Object.entries(mapStyles).reduce((acc, [key, value]) => ({
      ...acc,
      ...{
        [key]: Object.entries(value).reduce((acc2, [property, style]) => {
            return paintPropertiesMap[property] ? {...acc2, ...{[paintPropertiesMap[property]]: style}} : acc2;
          },
          {}),
      },
    }), {});
  };

  const getSymbology = (feature) => {
    switch (feature.geometry.type) {
      case 'Point':
      case 'MultiPoint':
        return getPointSymbology(feature);
      case 'LineString':
      case 'MultiLineString':
        return getLineSymbology(feature);
      case 'Polygon':
      case 'MultiPolygon':
        return getPolygonSymbology(feature);
      case 'GeometryCollection':
        const geometryCollectionSymbology = [];
        feature.geometry.geometries.forEach((g, i) => {
          let tempFeature = JSON.parse(JSON.stringify(feature));
          tempFeature.geometry = g;
          if (i % 2 === 1) tempFeature.properties.isInterbed = true;
          geometryCollectionSymbology.push(getSymbology(tempFeature));
        });
        return geometryCollectionSymbology;
      default:
        return {};
    }
  };

  return {
    addSymbology,
    getLayoutSymbology,
    getLinesFilteredByPattern,
    getMapSymbology,
    getPaintSymbology,
    getSymbology,
  };
};

export default useMapSymbology;
