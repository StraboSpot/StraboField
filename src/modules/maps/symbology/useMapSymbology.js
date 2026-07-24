import {useSelector} from 'react-redux';

import {LAYOUT_PROPERTIES_MAP, LINE_PATTERNS, PAINT_PROPERTIES_MAP} from './mapSymbology.constants';
import {getIconImage, getIconRotation, getLabel, getLabelOffset} from './mapSymbology.helpers';
import {hexToRgb, isEmpty} from '../../../shared/helpers';
import {MEDIUMGREY} from '../../../shared/styles.constants';
import {useTags} from '../../tags';
import {GLYPH_FONT} from '../glyphs/glyphs.constants';
import useStratSectionSymbology from '../strat-section/useStratSectionSymbology';

const useMapSymbology = () => {
  /* Data Hooks */

  const labelTypeOn = useSelector(state => state.map.labelTypeOn);
  const tagTypeForColor = useSelector(state => state.map.tagTypeForColor);

  const {getStratIntervalFill} = useStratSectionSymbology();
  const {getTagsAtSpot} = useTags();

  /* Derived Variables */

  // Null-safe line style expressions: a feature may lack a `symbology` property (or its line sub-properties),
  // in which case `['get', ...]` returns null and Mapbox GL JS logs an error while coercing to a color/number.
  // Fall back to Mapbox's spec defaults (line-color #000000, line-width 1) so native GL — which already
  // silently substitutes these defaults on the null result — renders identically.
  const lineColorExpression = [
    'case', ['all', ['has', 'symbology'], ['has', 'lineColor', ['get', 'symbology']]],
    ['get', 'lineColor', ['get', 'symbology']],
    '#000000',
  ];
  const lineWidthExpression = [
    'case', ['all', ['has', 'symbology'], ['has', 'lineWidth', ['get', 'symbology']]],
    ['get', 'lineWidth', ['get', 'symbology']],
    1,
  ];

  const mapStyles = {
    point: {
      textIgnorePlacement: true,  // Need to be able to stack symbols at same location
      textField: getLabel(labelTypeOn),
      textFont: GLYPH_FONT,       // Bundled font stack, so labels render offline (see glyphs.constants)
      textAnchor: 'left',
      textOffset: getLabelOffset(),
      textOptional: true,         // Draw the icon even if its label glyphs can't load, so points never vanish
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
      textField: getLabel(labelTypeOn),
      textFont: GLYPH_FONT,
      symbolPlacement: 'line',
      textAnchor: 'bottom',
    },
    line: {
      lineColor: lineColorExpression,
      lineWidth: lineWidthExpression,
    },
    lineDotted: {
      lineColor: lineColorExpression,
      lineWidth: lineWidthExpression,
      lineDasharray: LINE_PATTERNS.dotted,  // Can't use data-driven styling with line-dasharray - it is not supported
                                            // Used filters on the line layers instead
                                            // https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#paint-line-line-dasharray
    },
    lineDashed: {
      lineColor: lineColorExpression,
      lineWidth: lineWidthExpression,
      lineDasharray: LINE_PATTERNS.dashed,
    },
    lineDotDashed: {
      lineColor: lineColorExpression,
      lineWidth: lineWidthExpression,
      lineDasharray: LINE_PATTERNS.dotDashed,
    },
    polygonLabel: {
      textField: getLabel(labelTypeOn),
      textFont: GLYPH_FONT,
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
      lineWidth: lineWidthExpression,
    },
    lineSelectedDotted: {
      lineColor: 'orange',
      lineWidth: lineWidthExpression,
      lineDasharray: LINE_PATTERNS.dotted,
    },
    lineSelectedDashed: {
      lineColor: 'orange',
      lineWidth: lineWidthExpression,
      lineDasharray: LINE_PATTERNS.dashed,
    },
    lineSelectedDotDashed: {
      lineColor: 'orange',
      lineWidth: lineWidthExpression,
      lineDasharray: LINE_PATTERNS.dotDashed,
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
    // Dark disc behind pointDraw so drawn/edited vertices keep a visible rim on light backgrounds (e.g. a white strat section)
    pointDrawHalo: {
      circleRadius: 7.5,
      circleColor: 'black',
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
    // Dark disc drawn behind pointEdit so the vertex has a dark rim on light backgrounds (e.g. a white strat section)
    pointEditHalo: {
      circleRadius: 12.5,
      circleColor: 'black',
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
      textFont: GLYPH_FONT,
      textAnchor: 'bottom-left',
      textOffset: [1, 1],
      textRotate: 45,
      textIgnorePlacement: true,
      textSize: 10,
    },
    yAxisTickMarkLabels: {
      textField: ['get', 'label'],
      textFont: GLYPH_FONT,
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

  const getLineSymbology = (feature) => {
    let color = '#663300';
    let width = 2;
    let lineDash = LINE_PATTERNS.solid;

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
      lineDash = LINE_PATTERNS.dotted;
      switch (trace.trace_quality) {
        case 'known':
          lineDash = LINE_PATTERNS.solid;
          break;
        case 'approximate':
        case 'approximate(?)':
          lineDash = LINE_PATTERNS.dashed;
          break;
        case 'other':
          lineDash = LINE_PATTERNS.dotDashed;
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
      // When the Geologic Unit / Tag Colors switch is on, show the matching tag color for the interval's spot,
      // defaulting to white when there is no matching tag color. Otherwise use the lithology-based fill.
      if (tagTypeForColor) return {fillColor: getTagColor(feature) || 'rgba(255, 255, 255, 1)'};
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

  // If feature has a tag of the type specified in the Map Symbols dialog (geologic unit or tag)
  // and that tag has a color assigned to then apply that color first
  const getTagColor = (feature) => {
    let color;
    let tagsAtSpot = getTagsAtSpot(feature.properties.id);
    const tagsForColor = tagsAtSpot.filter(tag => tag.type === tagTypeForColor
      || (tagTypeForColor === 'tag' && tag.type !== 'geologic_unit'));
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
    return Object.entries(mapStyles).reduce((acc, [key, value]) => ({
      ...acc,
      ...{
        [key]: Object.entries(value).reduce((acc2, [property, style]) => {
            return LAYOUT_PROPERTIES_MAP[property] ? {...acc2, ...{[LAYOUT_PROPERTIES_MAP[property]]: style}} : acc2;
          },
          {}),
      },
    }), {});
  };

  const getLinesFilteredByPattern = (pattern) => {
    return (
      ['all',
        ['==', ['geometry-type'], 'LineString'],
        ['==', ['to-string', ['get', 'lineDasharray', ['get', 'symbology']]], ['to-string', ['literal', LINE_PATTERNS[pattern]]]],
      ]
    );
  };

  const getMapSymbology = () => mapStyles;

  const getPaintSymbology = () => {
    return Object.entries(mapStyles).reduce((acc, [key, value]) => ({
      ...acc,
      ...{
        [key]: Object.entries(value).reduce((acc2, [property, style]) => {
            return PAINT_PROPERTIES_MAP[property] ? {...acc2, ...{[PAINT_PROPERTIES_MAP[property]]: style}} : acc2;
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
