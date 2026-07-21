import {PixelRatio, Platform} from 'react-native';

import * as turf from '@turf/turf';
import proj4 from 'proj4';

import {GEO_LAT_LNG_PROJECTION, MAP_MODES, PIXEL_PROJECTION} from './maps.constants';
import {isEmpty} from '../../shared/helpers';

// Add a new vertex to a line. Returns [newLine, newPointOnLine]; does not mutate the input.
export const addVertexToLine = (line, newVertex) => {
  console.log('Adding vertex to selected line feature...');
  const newPointOnLine = turf.nearestPointOnLine(line, newVertex);
  const i = newPointOnLine.properties.index;
  const newLine = JSON.parse(JSON.stringify(line));
  newLine.geometry.coordinates.splice(i + 1, 0, newPointOnLine.geometry.coordinates);
  return [newLine, newPointOnLine];
};

// Add a new vertex to a polygon. Returns [newPolygon, nearestPointOnLine]; does not mutate the input.
export const addVertexToPolygon = (polygon, newVertex) => {
  console.log('Adding vertex to selected polygon feature...');

  // Split the ring into segments and pick the one nearest newVertex, tagging each with its index.
  let lines = turf.lineSegment(polygon).features;
  const nearestPointOnLine = lines.reduce((acc, line, i) => {
    let nearestPointToTest = turf.nearestPointOnLine(line, newVertex);
    nearestPointToTest.properties.index = i;
    return isEmpty(acc) || nearestPointToTest.properties.dist < acc.properties.dist ? nearestPointToTest : acc;
  }, {});

  // Insert the new vertex right after that segment's start position.
  const newPolygon = JSON.parse(JSON.stringify(polygon));
  newPolygon.geometry.coordinates[0].splice(nearestPointOnLine.properties.index + 1, 0,
    nearestPointOnLine.geometry.coordinates);

  return [newPolygon, nearestPointOnLine];
};

// Convert coordinates of a feature from one projection to another
export const convertCoords = (feature, fromProjection, toProjection) => {
  if (feature.geometry.type === 'Point') {
    feature.geometry.coordinates = proj4(fromProjection, toProjection, feature.geometry.coordinates);
  }
  else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiPoint') {
    feature.geometry.coordinates = feature.geometry.coordinates.map(
      pointCoords => proj4(fromProjection, toProjection, pointCoords));
  }
  else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiLineString') {
    feature.geometry.coordinates = feature.geometry.coordinates.map(
      lineCoords => lineCoords.map(pointCoords => proj4(fromProjection, toProjection, pointCoords)));
  }
  else if (feature.geometry.type === 'MultiPolygon') {
    feature.geometry.coordinates = feature.geometry.coordinates.map(polygonCoords => polygonCoords.map(
      lineCoords => lineCoords.map(pointCoords => proj4(fromProjection, toProjection, pointCoords))));
  }
  // Interbedded (Geometry Collections)
  else if (feature.geometry.type === 'GeometryCollection') {
    feature.geometry.geometries = feature.geometry.geometries.map((geometry) => {
      return {
        type: geometry.type,
        coordinates: geometry.coordinates.map(
          lineCoords => lineCoords.map(pointCoords => proj4(fromProjection, toProjection, pointCoords))),
      };
    });
  }
  return feature;
};

// Convert WGS84 to image x,y pixels, assuming x,y are web mercator
export const convertFeatureGeometryToImagePixels = feature => convertCoords(feature, GEO_LAT_LNG_PROJECTION,
  PIXEL_PROJECTION);

// Convert image x,y pixels to WGS84, assuming x,y are web mercator
export const convertImagePixelsToLatLong = feature => convertCoords(feature, PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION);

// Delete the vertices at the given coordinate indices from a LineString or Polygon. Returns
// [updatedFeature, isModified]; does not mutate the input. Keeps a line's 2-vertex and a polygon's
// 4-position minimums (nothing removed below them), and re-closes a polygon ring when its first
// position is deleted.
export const deleteVertexFromGeometry = (feature, indicesToDelete) => {
  const updatedFeature = JSON.parse(JSON.stringify(feature));
  const coords = turf.getCoords(updatedFeature);
  let isModified = false;
  if (turf.getType(updatedFeature) === 'LineString' && coords.length > 2) {
    for (let i = 0; i < coords.length; i++) {
      if (indicesToDelete.includes(i)) {
        updatedFeature.geometry.coordinates.splice(i, 1);
        isModified = true;
      }
    }
  }
  else if (turf.getType(updatedFeature) === 'Polygon' && coords[0].length > 4) {
    const ring = updatedFeature.geometry.coordinates[0];
    for (let i = 0; i < coords.length; i++) {
      for (let j = 0; j < coords[i].length; j++) {
        if (indicesToDelete.includes(j)) {
          updatedFeature.geometry.coordinates[i].splice(j, 1);
          isModified = true;
        }
      }
    }
    if (indicesToDelete.includes(0)) {
      // Removing the first position breaks ring closure; copy the new first onto the last to re-close.
      ring[ring.length - 1] = ring[0];
    }
  }
  else console.log('Not enough vertices in selected feature to delete one.');
  return [updatedFeature, isModified];
};

// Grow a line by duplicating an endpoint coordinate and inserting the copy at that end. Returns
// {updatedFeature, newVertexCoord, newVertexIndex}; does not mutate the input. Returns null if the
// feature is not a line or the vertex is not one of its endpoints.
export const extendLineAtEndpoint = (feature, endpointIndices) => {
  if (turf.getType(feature) !== 'LineString') return null;
  const lastIndex = feature.geometry.coordinates.length - 1;
  const isFirstEndpoint = endpointIndices.includes(0);
  const isLastEndpoint = endpointIndices.includes(lastIndex);
  if (!isFirstEndpoint && !isLastEndpoint) return null;
  const endpointCoord = isFirstEndpoint ? feature.geometry.coordinates[0] : feature.geometry.coordinates[lastIndex];
  const newVertexCoord = [...endpointCoord];
  const updatedFeature = JSON.parse(JSON.stringify(feature));
  let newVertexIndex;
  if (isFirstEndpoint) {
    updatedFeature.geometry.coordinates.unshift(newVertexCoord);
    newVertexIndex = 0;
  }
  else {
    updatedFeature.geometry.coordinates.push(newVertexCoord);
    newVertexIndex = updatedFeature.geometry.coordinates.length - 1;
  }
  return {updatedFeature, newVertexCoord, newVertexIndex};
};

// Get a pixel bounding box with padding around a point pressed on screen. A smaller r tightens the
// tap tolerance (r near 0 requires a press directly on the feature).
export const getBBoxPaddedInPixels = ([x, y], r = 15) => {
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

// Get the closest spot distance and index from an array of distances
export const getClosestSpotDistanceAndIndex = (distancesFromSpot) => {
  let minDistance = Number.MAX_VALUE;
  let minIndex = -1;
  for (let j = 0; j < distancesFromSpot.length; j++) {
    if (minDistance > distancesFromSpot[j]) { // trying to get the minimum distance
      minDistance = distancesFromSpot[j];
      minIndex = j;
    } // else we can ignore that feature.
  }
  return [minDistance, minIndex];
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

export const isDrawMode = mode => Object.values(MAP_MODES.DRAW).includes(mode);

export const isOnGeoMap = feature => isEmpty(feature) ? false
  : !feature.properties.image_basemap && !feature.properties.strat_section_id;

export const isOnImageBasemap = feature => feature.properties?.image_basemap;

export const isOnStratSection = feature => feature.properties?.strat_section_id;

// Slice a line feature into two at an added vertex point, returning the two cleaned line features
// (geometry only). The caller assigns identity and properties to each resulting Spot.
export const splitLineAtVertex = (lineFeature, vertexAdded) => {
  const lineCoords = turf.getCoords(lineFeature);
  const endPoint1 = turf.point(lineCoords[0]);
  const endPoint2 = turf.point(lineCoords[lineCoords.length - 1]);
  const lineSplit1 = turf.cleanCoords(turf.lineSlice(endPoint1, vertexAdded, lineFeature));
  const lineSplit2 = turf.cleanCoords(turf.lineSlice(vertexAdded, endPoint2, lineFeature));
  return [lineSplit1, lineSplit2];
};
