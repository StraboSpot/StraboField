import React from 'react';
import {Image, Text, View} from 'react-native';

import * as turf from '@turf/turf';
import polylabel from 'polylabel';
import Svg, {Defs, Image as SvgImage, Path, Pattern, Text as SvgText, TextPath} from 'react-native-svg';
import {useSelector} from 'react-redux';

import {
  LINE_PATTERNS,
  MAP_DEFAULT_COLOR,
  MAP_DEFAULT_LINE_WIDTH,
  MAP_SYMBOL_IMAGE_SIZE,
  MAP_SYMBOLS,
} from './mapSymbology.constants';
import {
  getFrameProjection,
  getLabelOffsetX,
  getLabelText,
  getSymbolImageName,
  getSymbolRotation,
  getTurnedSymbolBounds,
  getUprightLine,
} from './mapSymbology.helpers';
import useMapSymbology from './useMapSymbology';
import {isEmpty, isEqual} from '../../../shared/helpers';
import {BLACK, LIGHTGREY, MEDIUMGREY} from '../../../shared/styles.constants';
import {isLineSpot, isOnGeoMap, isPolygonSpot} from '../../spots/spots.helpers';
import useMapFeatures from '../features/useMapFeatures';
import {getFeaturesWithSamples} from '../layers/layers.helpers';
import {STRAT_PATTERN_IMAGE_SIZE, STRAT_PATTERNS} from '../strat-section/stratSection.constants';

const FRAME_BORDER_WIDTH = 1;
const FRAME_SIZE = 48;
const INSIDE_SIZE = FRAME_SIZE - 2 * FRAME_BORDER_WIDTH;
const MAP_TEXT_MAX_WIDTH = 10;     // Mapbox's default text-max-width in ems, past which the map's labels wrap
const MAP_TEXT_SIZE = 16;          // Mapbox's default text-size, which the map's labels use
const SHAPE_PADDING = 4;
const SYMBOL_SIZE = 40;

// A Spot drawn as the map draws it, in a frame like a piece of the map, with the labels for the current label setting.
// A point is centered in the frame and drawn bottom to top as its tag/geologic unit color halo, its sample starburst
// when samples are shown, then a symbol per measurement, all stacked and turned. A line or polygon is fitted to the
// frame and drawn with the map's fill, fill pattern, outline, color, width and dashes. Whatever runs past the frame is
// cut off, as at the edge of the map.
const SpotMapSymbolAvatar = ({spot}) => {
  /* Data Hooks */

  const isShowSamplesOn = useSelector(state => state.map.isShowSamplesOn);
  const labelTypeOn = useSelector(state => state.map.labelTypeOn);

  const {getSpotsAsFeatures} = useMapFeatures();
  const {addSymbology, getMapSymbology} = useMapSymbology();

  /* Derived Variables */

  const {point, pointColorHalo, sample} = getMapSymbology();
  const scale = SYMBOL_SIZE / (MAP_SYMBOL_IMAGE_SIZE * point.iconSize);
  const textSize = MAP_TEXT_SIZE * scale;
  const features = getSpotsAsFeatures(addSymbology([spot]));
  const isPoint = spot.geometry.type === 'Point' || spot.geometry.type === 'MultiPoint';

  /* Render Functions */

  // A label anchored at its left edge (points) or its center (polygons), wrapping as the map's labels do
  const renderLabel = (key, label, x, y, isAnchoredLeft) => {
    const width = MAP_TEXT_MAX_WIDTH * textSize;
    return (
      <View
        key={key}
        style={{
          alignItems: isAnchoredLeft ? 'flex-start' : 'center',
          height: 2 * FRAME_SIZE,
          justifyContent: 'center',
          left: isAnchoredLeft ? x : x - width / 2,
          position: 'absolute',
          top: y - FRAME_SIZE,
          width: width,
        }}
      >
        <Text style={{color: BLACK, fontSize: textSize, textAlign: isAnchoredLeft ? 'left' : 'center'}}>
          {String(label ?? '')}
        </Text>
      </View>
    );
  };

  const renderPoint = () => {
    const haloColor = features[0]?.properties.symbology?.circleColor;
    const isHaloShown = !!haloColor && haloColor !== 'transparent';
    const haloSize = 2 * pointColorHalo.circleRadius * scale;
    const sampleSize = MAP_SYMBOL_IMAGE_SIZE * sample.iconSize * scale;
    const isSampleShown = isShowSamplesOn && !isEmpty(getFeaturesWithSamples(features));
    const symbols = features.map(feature => ({
      imageName: getSymbolImageName(feature.properties.orientation),
      rotation: getSymbolRotation(feature.properties.orientation),
    })).filter(symbol => symbol.imageName);

    // Place the Spot so the box around everything drawn under the labels is centered
    const getScaledBounds = (imageName, rotation, size) => getTurnedSymbolBounds(imageName, rotation)
      .map(edge => edge * size / MAP_SYMBOL_IMAGE_SIZE);
    const drawnBounds = symbols.map(({imageName, rotation}) => getScaledBounds(imageName, rotation, SYMBOL_SIZE));
    if (isSampleShown) drawnBounds.push(getScaledBounds(sample.iconImage, 0, sampleSize));
    if (isHaloShown) drawnBounds.push([-haloSize / 2, -haloSize / 2, haloSize / 2, haloSize / 2]);
    if (isEmpty(drawnBounds)) drawnBounds.push([0, 0, 0, 0]);   // Only labels: the Spot goes at the center
    const getSpotPosition = (startEdge, endEdge) => INSIDE_SIZE / 2 - (Math.min(...drawnBounds.map(b => b[startEdge]))
      + Math.max(...drawnBounds.map(b => b[endEdge]))) / 2;
    const spotX = getSpotPosition(0, 2);
    const spotY = getSpotPosition(1, 3);

    // Absolutely positioned square of the given size, centered on the Spot
    const getCenteredStyle = size => ({
      height: size,
      left: spotX - size / 2,
      position: 'absolute',
      top: spotY - size / 2,
      width: size,
    });

    return (
      <>
        {isHaloShown && (
          <View style={[getCenteredStyle(haloSize), {backgroundColor: haloColor, borderRadius: haloSize / 2}]}/>
        )}
        {isSampleShown && <Image source={MAP_SYMBOLS[sample.iconImage]} style={getCenteredStyle(sampleSize)}/>}
        {symbols.map(({imageName, rotation}, index) => (
          <Image
            key={'symbol' + index}
            source={MAP_SYMBOLS[imageName]}
            style={[getCenteredStyle(SYMBOL_SIZE), {transform: [{rotate: rotation + 'deg'}]}]}
          />
        ))}
        {features.map((feature, index) => renderLabel('label' + index,
          getLabelText(feature.properties, labelTypeOn),
          spotX + getLabelOffsetX(feature.properties.orientation) * textSize, spotY, true))}
      </>
    );
  };

  const renderShapes = () => {
    // Place every line and polygon in the frame, in the map's Web Mercator proportions. A GeometryCollection can hold
    // other kinds of geometry too, which have no shape to draw.
    const shapeFeatures = features.filter(feature => isLineSpot(feature) || isPolygonSpot(feature))
      .map(feature => isOnGeoMap(spot) ? {...feature, geometry: turf.toMercator(feature.geometry)} : feature);
    const toFrame = getFrameProjection(turf.bbox(turf.featureCollection(shapeFeatures)), INSIDE_SIZE, SHAPE_PADDING);

    // One part per piece drawn, as a Multi geometry is drawn as several
    const getParts = geometry => geometry.type.startsWith('Multi') ? geometry.coordinates : [geometry.coordinates];
    const getPathData = points => 'M' + points.map(([x, y]) => `${x} ${y}`).join(' L');
    const polygonParts = shapeFeatures.filter(isPolygonSpot).flatMap(({geometry, properties}) => getParts(geometry)
      .map((rings) => {
        const framedRings = rings.map(ring => ring.map(toFrame));
        return {d: framedRings.map(ring => getPathData(ring) + ' Z').join(' '), properties, rings: framedRings};
      }));
    const lineParts = shapeFeatures.filter(isLineSpot).flatMap(({geometry, properties}) => getParts(geometry)
      .map(points => ({points: points.map(toFrame), properties})));

    const idPrefix = `spot-${spot.properties.id}-`;
    const patternSize = STRAT_PATTERN_IMAGE_SIZE * scale;
    const getLineStyle = symbology => ({
      stroke: symbology?.lineColor ?? MAP_DEFAULT_COLOR,
      strokeWidth: (symbology?.lineWidth ?? MAP_DEFAULT_LINE_WIDTH) * scale,
    });

    return (
      <>
        <Svg height={INSIDE_SIZE} style={{position: 'absolute'}} width={INSIDE_SIZE}>
          <Defs>
            {polygonParts.map((part, index) => !!part.properties.symbology?.fillPattern && (
              <Pattern
                height={patternSize}
                id={idPrefix + 'pattern' + index}
                key={'pattern' + index}
                patternUnits={'userSpaceOnUse'}
                width={patternSize}
              >
                <SvgImage
                  height={patternSize}
                  href={STRAT_PATTERNS[part.properties.symbology.fillPattern]}
                  width={patternSize}
                />
              </Pattern>
            ))}
            {lineParts.map((part, index) => (
              <Path d={getPathData(getUprightLine(part.points))} id={idPrefix + 'label' + index} key={'label' + index}/>
            ))}
          </Defs>
          {polygonParts.map(({d, properties}, index) => (
            <Path
              d={d}
              fill={properties.symbology?.fillPattern ? `url(#${idPrefix}pattern${index})`
                : properties.symbology?.fillColor ?? MAP_DEFAULT_COLOR}
              fillRule={'evenodd'}
              key={'fill' + index}
            />
          ))}
          {polygonParts.map(({d, properties}, index) => (
            <Path d={d} fill={'none'} key={'outline' + index} {...getLineStyle(properties.symbology)}/>
          ))}
          {lineParts.map(({points, properties}, index) => {
            const lineStyle = getLineStyle(properties.symbology);
            const dashes = properties.symbology?.lineDasharray;
            return (
              <Path
                d={getPathData(points)}
                fill={'none'}
                key={'line' + index}
                strokeDasharray={dashes && !isEqual(dashes, LINE_PATTERNS.solid)
                  ? dashes.map(dash => dash * lineStyle.strokeWidth) : undefined}
                {...lineStyle}
              />
            );
          })}
          {lineParts.map(({properties}, index) => (
            <SvgText fill={BLACK} fontSize={textSize} key={'lineLabel' + index} textAnchor={'middle'}>
              <TextPath href={'#' + idPrefix + 'label' + index} startOffset={'50%'}>
                {String(getLabelText(properties, labelTypeOn) ?? '')}
              </TextPath>
            </SvgText>
          ))}
        </Svg>
        {polygonParts.map(({properties, rings}, index) => {
          const [x, y] = polylabel(rings, 0.5);
          return renderLabel('polygonLabel' + index, getLabelText(properties, labelTypeOn), x, y, false);
        })}
      </>
    );
  };

  /* View */

  return (
    <View
      style={{
        backgroundColor: LIGHTGREY,
        borderColor: MEDIUMGREY,
        borderWidth: FRAME_BORDER_WIDTH,
        height: FRAME_SIZE,
        overflow: 'hidden',
        width: FRAME_SIZE,
      }}
    >
      {isPoint ? renderPoint() : renderShapes()}
    </View>
  );
};

export default SpotMapSymbolAvatar;
