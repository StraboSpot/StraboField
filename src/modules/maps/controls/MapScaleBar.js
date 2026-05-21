import React from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import controlStyles from './controls.styles';

const METERS_PER_FOOT = 0.3048;
const METERS_PER_MILE = 1609.344;
const NICE_IMPERIAL_FEET = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const NICE_IMPERIAL_MILES = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100];
const NICE_METRIC_METERS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
const TARGET_WIDTH_PX = 100;

const MapScaleBar = ({zoom: zoomProp}) => {
  const {center, isScaleBarMetric, zoom: zoomRedux} = useSelector(state => state.map);
  const zoom = zoomProp ?? zoomRedux;

  if (zoom == null) return null;

  const lat = Array.isArray(center) ? (center[1] || 0) : 0;
  // Mapbox GL uses 512px tiles; ground resolution at given zoom and latitude
  const metersPerPixel = (78271.517 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom);

  if (!isFinite(metersPerPixel) || metersPerPixel <= 0) return null;

  const targetMeters = metersPerPixel * TARGET_WIDTH_PX;

  let barWidthPx, label;

  if (isScaleBarMetric) {
    const niceMeters = NICE_METRIC_METERS.find(v => v >= targetMeters)
      ?? NICE_METRIC_METERS[NICE_METRIC_METERS.length - 1];
    barWidthPx = niceMeters / metersPerPixel;
    label = niceMeters >= 1000 ? `${niceMeters / 1000} km` : `${niceMeters} m`;
  }
  else {
    const targetFeet = targetMeters / METERS_PER_FOOT;
    if (targetFeet < 4000) {
      const niceFeet = NICE_IMPERIAL_FEET.find(v => v >= targetFeet)
        ?? NICE_IMPERIAL_FEET[NICE_IMPERIAL_FEET.length - 1];
      barWidthPx = (niceFeet * METERS_PER_FOOT) / metersPerPixel;
      label = `${niceFeet} ft`;
    }
    else {
      const targetMiles = targetMeters / METERS_PER_MILE;
      const niceMiles = NICE_IMPERIAL_MILES.find(v => v >= targetMiles)
        ?? NICE_IMPERIAL_MILES[NICE_IMPERIAL_MILES.length - 1];
      barWidthPx = (niceMiles * METERS_PER_MILE) / metersPerPixel;
      label = `${niceMiles} mi`;
    }
  }

  barWidthPx = Math.min(Math.max(barWidthPx, 20), 250);

  return (
    <View style={[controlStyles.scaleBar, {width: barWidthPx}]}>
      <Text style={controlStyles.scaleBarLabel}>{label}</Text>
    </View>
  );
};

export default MapScaleBar;
