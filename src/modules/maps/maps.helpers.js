import {PixelRatio, Platform} from 'react-native';

import * as turf from '@turf/turf';
import proj4 from 'proj4';

import {GEO_LAT_LNG_PROJECTION, MAP_MODES, PIXEL_PROJECTION} from './maps.constants';
import {isEmpty} from '../../shared/helpers';

// Add a new vertex to a line
export const addVertexToLine = (line, newVertex) => {
  console.log('Adding vertex to selected line feature...');
  const newPointOnLine = turf.nearestPointOnLine(line, newVertex);
  const i = newPointOnLine.properties.index;
  line.geometry.coordinates.splice(i + 1, 0, newPointOnLine.geometry.coordinates);
  return [line, newPointOnLine];
};

// Add a new vertex to a polygon
export const addVertexToPolygon = (polygon, newVertex) => {
  console.log('Adding vertex to selected polygon feature...');

  // Get all the lines that make up the polygon
  let lines = turf.lineSegment(polygon).features;

  // Get the nearest point among all lines to the pressed screen point
  const nearestPointOnLine = lines.reduce((acc, line, i) => {
    let nearestPointToTest = turf.nearestPointOnLine(line, newVertex);
    nearestPointToTest.properties.index = i;
    return isEmpty(acc) || nearestPointToTest.properties.dist < acc.properties.dist ? nearestPointToTest : acc;
  }, {});

  // Add the new vertex to the polygon
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

// Delete the vertices at the given coordinate indices from a LineString or Polygon feature, mutating
// it in place. A LineString must keep more than 2 vertices and a Polygon more than 4 ring positions,
// otherwise nothing is removed. When a Polygon's first position is removed the ring is re-closed by
// copying the new first position onto the last. Returns whether any vertex was removed.
export const deleteVertexFromGeometry = (feature, indicesToDelete) => {
  const coords = turf.getCoords(feature);
  let isModified = false;
  if (turf.getType(feature) === 'LineString' && coords.length > 2) {
    for (let i = 0; i < coords.length; i++) {
      if (indicesToDelete.includes(i)) {
        feature.geometry.coordinates.splice(i, 1);
        isModified = true;
      }
    }
  }
  else if (turf.getType(feature) === 'Polygon' && coords[0].length > 4) {
    for (let i = 0; i < coords.length; i++) {
      for (let j = 0; j < coords[i].length; j++) {
        if (indicesToDelete.includes(j)) {
          feature.geometry.coordinates[i].splice(j, 1);
          isModified = true;
        }
      }
    }
    if (indicesToDelete.includes(0)) {
      // when the first spot is deleted, update the last spot to the current first spot.
      feature.geometry.coordinates[0][feature.geometry.coordinates[0].length - 1] = feature.geometry.coordinates[0][0];
    }
  }
  else console.log('Not enough vertices in selected feature to delete one.');
  return isModified;
};

// Grow a line by duplicating one of its endpoint coordinates: inserts a copy at whichever end the
// given vertex indices point to, mutating the feature. Returns the duplicated coordinate and its new
// index, or null if the feature is not a line or the vertex is not one of its endpoints.
export const extendLineAtEndpoint = (feature, endpointIndices) => {
  if (turf.getType(feature) !== 'LineString') return null;
  const lastIndex = feature.geometry.coordinates.length - 1;
  const isFirstEndpoint = endpointIndices.includes(0);
  const isLastEndpoint = endpointIndices.includes(lastIndex);
  if (!isFirstEndpoint && !isLastEndpoint) return null;
  const endpointCoord = isFirstEndpoint ? feature.geometry.coordinates[0] : feature.geometry.coordinates[lastIndex];
  const newVertexCoord = [...endpointCoord];
  let newVertexIndex;
  if (isFirstEndpoint) {
    feature.geometry.coordinates.unshift(newVertexCoord);
    newVertexIndex = 0;
  }
  else {
    feature.geometry.coordinates.push(newVertexCoord);
    newVertexIndex = feature.geometry.coordinates.length - 1;
  }
  return {newVertexCoord, newVertexIndex};
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
