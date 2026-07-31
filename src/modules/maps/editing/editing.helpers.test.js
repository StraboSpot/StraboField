import * as turf from '@turf/turf';

import {
  addVertexToLine,
  addVertexToPolygon,
  deleteVertexFromGeometry,
  extendLineAtEndpoint,
  getFeatureWithNewVertex,
  splitLineAtVertex,
  thinCoordsByDistance,
  thinCoordsByPixels,
} from './editing.helpers';

// Characterization tests: these pin the CURRENT behavior of the pure geometry helpers
// (bugs and quirks included) so a later refactor of useMapEditVertex / useMapDraw can be shown to
// preserve behavior. They are intentionally assertion-heavy on structure, not prose.

describe('addVertexToLine', () => {
  it('inserts the nearest point into the line and returns [line, newPointOnLine]', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);
    const newVertex = turf.point([5, 0.0001]);

    const [returnedLine, newPointOnLine] = addVertexToLine(line, newVertex);

    // Vertex inserted between the two endpoints -> 3 coordinates
    expect(returnedLine.geometry.coordinates).toHaveLength(3);
    const [mx, my] = returnedLine.geometry.coordinates[1];
    expect(mx).toBeCloseTo(5, 3);
    expect(my).toBeCloseTo(0, 3);

    // nearestPointOnLine reports the segment index it was inserted after
    expect(newPointOnLine.properties.index).toBe(0);
  });

  it('does not mutate the input line (deep-copies first)', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);
    const [returnedLine] = addVertexToLine(line, turf.point([5, 0.0001]));

    // A new feature is returned and the original is left untouched
    expect(returnedLine).not.toBe(line);
    expect(line.geometry.coordinates).toHaveLength(2);
  });
});

describe('addVertexToPolygon', () => {
  it('inserts the nearest point into the ring and returns [newPolygon, nearestPointOnLine]', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]);
    const newVertex = turf.point([5, 0.0001]);

    const [newPolygon, nearestPointOnLine] = addVertexToPolygon(polygon, newVertex);

    // Ring grew from 5 to 6 coordinates, new vertex on the bottom edge (segment 0)
    expect(newPolygon.geometry.coordinates[0]).toHaveLength(6);
    expect(nearestPointOnLine.properties.index).toBe(0);
    const [ix, iy] = newPolygon.geometry.coordinates[0][1];
    expect(ix).toBeCloseTo(5, 3);
    expect(iy).toBeCloseTo(0, 3);
  });

  it('does not mutate the input polygon (deep-copies first)', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]);
    addVertexToPolygon(polygon, turf.point([5, 0.0001]));

    expect(polygon.geometry.coordinates[0]).toHaveLength(5);
  });
});

describe('deleteVertexFromGeometry', () => {
  it('removes a middle vertex from a line with more than 2 vertices', () => {
    const line = turf.lineString([[0, 0], [5, 0], [10, 0]]);

    const [updatedLine, isModified] = deleteVertexFromGeometry(line, [1]);

    expect(isModified).toBe(true);
    expect(updatedLine.geometry.coordinates).toEqual([[0, 0], [10, 0]]);
    // Input left untouched
    expect(line.geometry.coordinates).toEqual([[0, 0], [5, 0], [10, 0]]);
  });

  it('does nothing to a 2-vertex line (must keep more than 2)', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);

    const [updatedLine, isModified] = deleteVertexFromGeometry(line, [0]);

    expect(isModified).toBe(false);
    expect(updatedLine.geometry.coordinates).toEqual([[0, 0], [10, 0]]);
  });

  it('removes a non-first vertex from a polygon with more than 4 ring positions', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]);

    const [updatedPolygon, isModified] = deleteVertexFromGeometry(polygon, [1]);

    expect(isModified).toBe(true);
    expect(updatedPolygon.geometry.coordinates[0]).toEqual([[0, 0], [10, 10], [0, 10], [0, 0]]);
    // Input left untouched
    expect(polygon.geometry.coordinates[0]).toEqual([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]);
  });

  it('re-closes the ring when the first polygon position is removed', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]);

    const [updatedPolygon, isModified] = deleteVertexFromGeometry(polygon, [0]);

    expect(isModified).toBe(true);
    const ring = updatedPolygon.geometry.coordinates[0];
    // First position [0,0] removed; ring's last position updated to the new first ([10,0]).
    expect(ring).toEqual([[10, 0], [10, 10], [0, 10], [10, 0]]);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('does nothing to a triangle polygon (must keep more than 4 ring positions)', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [5, 10], [0, 0]]]);

    const [updatedPolygon, isModified] = deleteVertexFromGeometry(polygon, [1]);

    expect(isModified).toBe(false);
    expect(updatedPolygon.geometry.coordinates[0]).toEqual([[0, 0], [10, 0], [5, 10], [0, 0]]);
  });
});

describe('extendLineAtEndpoint', () => {
  it('duplicates the first endpoint into a new feature and inserts the copy at the start', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);

    const {updatedFeature, newVertexCoord, newVertexIndex} = extendLineAtEndpoint(line, [0]);

    expect(newVertexCoord).toEqual([0, 0]);
    expect(newVertexIndex).toBe(0);
    expect(updatedFeature.geometry.coordinates).toEqual([[0, 0], [0, 0], [10, 0]]);
    // Input left untouched
    expect(line.geometry.coordinates).toEqual([[0, 0], [10, 0]]);
  });

  it('duplicates the last endpoint into a new feature and appends the copy at the end', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);

    const {updatedFeature, newVertexCoord, newVertexIndex} = extendLineAtEndpoint(line, [1]);

    expect(newVertexCoord).toEqual([10, 0]);
    expect(newVertexIndex).toBe(2);
    expect(updatedFeature.geometry.coordinates).toEqual([[0, 0], [10, 0], [10, 0]]);
    // Input left untouched
    expect(line.geometry.coordinates).toEqual([[0, 0], [10, 0]]);
  });

  it('returns null and leaves the line untouched when the vertex is not an endpoint', () => {
    const line = turf.lineString([[0, 0], [5, 0], [10, 0]]);

    const result = extendLineAtEndpoint(line, [1]);

    expect(result).toBeNull();
    expect(line.geometry.coordinates).toEqual([[0, 0], [5, 0], [10, 0]]);
  });

  it('returns null for a non-LineString feature', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 0]]]);

    expect(extendLineAtEndpoint(polygon, [0])).toBeNull();
  });
});

describe('splitLineAtVertex', () => {
  it('slices a line into two features that meet at the added vertex', () => {
    const line = turf.lineString([[0, 0], [5, 0], [10, 0]]);
    const vertexAdded = turf.point([5, 0]);

    const [lineSplit1, lineSplit2] = splitLineAtVertex(line, vertexAdded);

    expect(turf.getType(lineSplit1)).toBe('LineString');
    expect(turf.getType(lineSplit2)).toBe('LineString');

    const coords1 = lineSplit1.geometry.coordinates;
    const coords2 = lineSplit2.geometry.coordinates;
    // First segment runs start -> vertex, second runs vertex -> end.
    expect(coords1[0]).toEqual([0, 0]);
    expect(coords1[coords1.length - 1][0]).toBeCloseTo(5, 6);
    expect(coords2[0][0]).toBeCloseTo(5, 6);
    expect(coords2[coords2.length - 1]).toEqual([10, 0]);
  });
});

describe('getFeatureWithNewVertex', () => {
  it('adds a vertex to a LineString at the pressed native coordinate', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);
    const e = turf.point([5, 0.0001]);

    const [updatedFeature, newVertex] = getFeatureWithNewVertex(e, line);

    expect(turf.getType(updatedFeature)).toBe('LineString');
    expect(updatedFeature.geometry.coordinates).toHaveLength(3);
    expect(newVertex.geometry.coordinates[0]).toBeCloseTo(5, 3);
  });

  it('adds a vertex to a Polygon ring at the pressed native coordinate', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]);
    const e = turf.point([5, 0.0001]);

    const [updatedFeature, newVertex] = getFeatureWithNewVertex(e, polygon);

    expect(turf.getType(updatedFeature)).toBe('Polygon');
    expect(updatedFeature.geometry.coordinates[0]).toHaveLength(6);
    expect(newVertex.geometry.coordinates[0]).toBeCloseTo(5, 3);
  });
});

describe('thinCoordsByDistance', () => {
  it('returns coords unchanged when minMeters is falsy', () => {
    const coords = [[0, 0], [0, 1], [0, 2]];
    expect(thinCoordsByDistance(coords, 0)).toBe(coords);
  });

  it('returns coords unchanged when there are fewer than 3 points', () => {
    const coords = [[0, 0], [0, 5]];
    expect(thinCoordsByDistance(coords, 1)).toBe(coords);
  });

  it('always keeps the first and last points', () => {
    const coords = [[0, 0], [0, 0.00001], [0, 0.00002], [0, 5]];
    const thinned = thinCoordsByDistance(coords, 1000);
    expect(thinned[0]).toEqual([0, 0]);
    expect(thinned[thinned.length - 1]).toEqual([0, 5]);
  });

  it('drops intermediate points closer than minMeters to the last kept point', () => {
    // ~111 m per 0.001 deg latitude; keep points at least ~5 km apart.
    const coords = [[0, 0], [0, 0.001], [0, 0.05], [0, 0.051], [0, 0.1]];
    const thinned = thinCoordsByDistance(coords, 5000);
    expect(thinned).toEqual([[0, 0], [0, 0.05], [0, 0.1]]);
  });
});

describe('thinCoordsByPixels', () => {
  it('returns coords unchanged when minPixels is falsy', () => {
    const coords = [[0, 0], [1, 1], [2, 2]];
    expect(thinCoordsByPixels(coords, 0)).toBe(coords);
  });

  it('returns coords unchanged when there are fewer than 3 points', () => {
    const coords = [[0, 0], [10, 10]];
    expect(thinCoordsByPixels(coords, 5)).toBe(coords);
  });

  it('always keeps the first and last points', () => {
    const coords = [[0, 0], [1, 0], [2, 0], [100, 0]];
    const thinned = thinCoordsByPixels(coords, 50);
    expect(thinned[0]).toEqual([0, 0]);
    expect(thinned[thinned.length - 1]).toEqual([100, 0]);
  });

  it('drops intermediate points closer than minPixels to the last kept point', () => {
    const coords = [[0, 0], [3, 0], [10, 0], [12, 0], [20, 0]];
    const thinned = thinCoordsByPixels(coords, 10);
    expect(thinned).toEqual([[0, 0], [10, 0], [20, 0]]);
  });
});
