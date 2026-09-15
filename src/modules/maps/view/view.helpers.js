import {PixelRatio, Platform} from 'react-native';

import proj4 from 'proj4';

import {GEO_LAT_LNG_PROJECTION, PIXEL_PROJECTION, PRESS_BOX_PADDING} from '../maps.constants';

// Get a pixel bounding box with padding around a point pressed on screen. A smaller r tightens the
// tap tolerance (r near 0 requires a press directly on the feature).
export const getBBoxPaddedInPixels = ([x, y], r = PRESS_BOX_PADDING) => {
  const pixelRatio = PixelRatio.get();
  const maxX = x + r;
  const minX = x - r;
  const maxY = y + r;
  const minY = y - r;
  return Platform.OS === 'web' ? [[minX, minY], [maxX, maxY]]
    : Platform.OS === 'android' ? [maxY * pixelRatio, maxX * pixelRatio, minY * pixelRatio, minX * pixelRatio]
      : [maxY, maxX, minY, minX];  // [top, right, bottom, left]
};

// Get geographic bounds with padding around a point
export const getBoundsPadded = ([x, y]) => {
  const r = 0.01;  // padding
  const maxX = x + r;
  const minX = x - r;
  const maxY = y + r;
  const minY = y - r;
  return [maxY, maxX, minY, minX]; // [top, right, bottom, left]
};

// Identify the coordinate span for the image basemap adjusted by the given [x,y] (adjustment used for strat sections)
export const getCoordQuad = (imageBasemapProps, altOrigin) => {
  if (!imageBasemapProps || !imageBasemapProps.width || !imageBasemapProps.height) return undefined;
  // identify the [lat,lng] corners of the image basemap
  const x = altOrigin && altOrigin.x || 0;
  const y = altOrigin && altOrigin.y || 0;
  const bottomLeft = altOrigin ? proj4(PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION, [x, y]) : [x, y];
  const bottomRight = proj4(PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION, [imageBasemapProps.width + x, y]);
  const topRight = proj4(PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION,
    [imageBasemapProps.width + x, imageBasemapProps.height + y]);
  const topLeft = proj4(PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION, [x, imageBasemapProps.height + y]);
  let coordQuad = [topLeft, topRight, bottomRight, bottomLeft];
  console.log('The coordinates identified for image-basemap :', coordQuad);
  return coordQuad;
};
