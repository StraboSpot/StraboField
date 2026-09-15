import {Platform} from 'react-native';

import * as turf from '@turf/turf';

import {isEmpty} from '../../../shared/helpers';

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

// Add a vertex at the pressed location to a line or polygon feature. Returns [updatedFeature, newVertexPoint].
export const getFeatureWithNewVertex = (e, spotEditingCopy) => {
  const newVertexCoords = Platform.OS === 'web' ? [e.lngLat.lng, e.lngLat.lat] : turf.getCoord(e);
  const newVertex = turf.point(newVertexCoords);
  return turf.getType(spotEditingCopy) === 'LineString' ? addVertexToLine(spotEditingCopy, newVertex)
    : addVertexToPolygon(spotEditingCopy, newVertex);
};

// Larger dimension of a stroke's screen-pixel bounding box. A line is invisible only when BOTH dimensions are
// tiny, which is what this maximum being tiny means - testing either dimension alone would reject a deliberate
// straight line, which is wide in one and flat in the other.
export const getScreenExtent = (screenCoords) => {
  if (!screenCoords || screenCoords.length < 2) return 0;
  const xs = screenCoords.map(coord => coord[0]);
  const ys = screenCoords.map(coord => coord[1]);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
};

// Approximate width of a freehand stroke's ring in screen pixels: twice its shoelace area over its perimeter.
// Width, not area, is what separates a polygon from a sliver. A stroke that doubles back never retraces exactly,
// so it still encloses area - 2px of hand wobble over 300px is 600px2 - but its width stays near zero. Neither
// area nor the bounding box can see that; both read the sliver as large.
export const getScreenPolygonWidth = (screenCoords) => {
  if (!screenCoords || screenCoords.length < 3) return 0;
  let twiceArea = 0;
  let perimeter = 0;
  for (let i = 0; i < screenCoords.length; i++) {
    const [x1, y1] = screenCoords[i];
    const [x2, y2] = screenCoords[(i + 1) % screenCoords.length];
    twiceArea += x1 * y2 - x2 * y1;
    perimeter += Math.hypot(x2 - x1, y2 - y1);
  }
  return perimeter === 0 ? 0 : Math.abs(twiceArea) / perimeter;
};

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

// Thin geographic coords so kept vertices are at least minMeters apart (always keeps first and last).
export const thinCoordsByDistance = (coords, minMeters) => {
  if (!minMeters || coords.length < 3) return coords;
  const thinned = [coords[0]];
  let last = turf.point(coords[0]);
  for (let i = 1; i < coords.length - 1; i++) {
    const current = turf.point(coords[i]);
    if (turf.distance(last, current, {units: 'meters'}) >= minMeters) {
      thinned.push(coords[i]);
      last = current;
    }
  }
  thinned.push(coords[coords.length - 1]);
  return thinned;
};

// Thin freehand screen points so kept vertices are at least minPixels apart (always keeps first and last).
export const thinCoordsByPixels = (coords, minPixels) => {
  if (!minPixels || coords.length < 3) return coords;
  const thinned = [coords[0]];
  let last = coords[0];
  for (let i = 1; i < coords.length - 1; i++) {
    if (Math.hypot(coords[i][0] - last[0], coords[i][1] - last[1]) >= minPixels) {
      thinned.push(coords[i]);
      last = coords[i];
    }
  }
  thinned.push(coords[coords.length - 1]);
  return thinned;
};
