import * as turf from '@turf/turf';

import {
  addVertexToLine,
  addVertexToPolygon,
  deleteVertexFromGeometry,
  extendLineAtEndpoint,
  getClosestSpotDistanceAndIndex,
  splitLineAtVertex,
} from './maps.helpers';

// Characterization tests: these pin the CURRENT behavior of the pure geometry helpers
// (bugs and quirks included) so a later refactor of useMapFeaturesDraw can be shown to
// preserve behavior. They are intentionally assertion-heavy on structure, not prose.

describe('getClosestSpotDistanceAndIndex', () => {
  it('returns the minimum distance and its index', () => {
    expect(getClosestSpotDistanceAndIndex([5, 2, 8, 1, 9])).toEqual([1, 3]);
  });

  it('returns the first occurrence on ties (strict greater-than comparison)', () => {
    expect(getClosestSpotDistanceAndIndex([3, 3, 3])).toEqual([3, 0]);
  });

  it('handles a single-element array', () => {
    expect(getClosestSpotDistanceAndIndex([7])).toEqual([7, 0]);
  });

  it('returns [Number.MAX_VALUE, -1] for an empty array', () => {
    expect(getClosestSpotDistanceAndIndex([])).toEqual([Number.MAX_VALUE, -1]);
  });
});

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

  it('mutates the input line in place (current behavior)', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);
    const [returnedLine] = addVertexToLine(line, turf.point([5, 0.0001]));

    // Same object reference is returned and the original now has 3 coords
    expect(returnedLine).toBe(line);
    expect(line.geometry.coordinates).toHaveLength(3);
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

    const isModified = deleteVertexFromGeometry(line, [1]);

    expect(isModified).toBe(true);
    expect(line.geometry.coordinates).toEqual([[0, 0], [10, 0]]);
  });

  it('does nothing to a 2-vertex line (must keep more than 2)', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);

    const isModified = deleteVertexFromGeometry(line, [0]);

    expect(isModified).toBe(false);
    expect(line.geometry.coordinates).toEqual([[0, 0], [10, 0]]);
  });

  it('removes a non-first vertex from a polygon with more than 4 ring positions', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]);

    const isModified = deleteVertexFromGeometry(polygon, [1]);

    expect(isModified).toBe(true);
    expect(polygon.geometry.coordinates[0]).toEqual([[0, 0], [10, 10], [0, 10], [0, 0]]);
  });

  it('re-closes the ring when the first polygon position is removed', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]);

    const isModified = deleteVertexFromGeometry(polygon, [0]);

    expect(isModified).toBe(true);
    const ring = polygon.geometry.coordinates[0];
    // First position [0,0] removed; ring's last position updated to the new first ([10,0]).
    expect(ring).toEqual([[10, 0], [10, 10], [0, 10], [10, 0]]);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('does nothing to a triangle polygon (must keep more than 4 ring positions)', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [5, 10], [0, 0]]]);

    const isModified = deleteVertexFromGeometry(polygon, [1]);

    expect(isModified).toBe(false);
    expect(polygon.geometry.coordinates[0]).toEqual([[0, 0], [10, 0], [5, 10], [0, 0]]);
  });
});

describe('extendLineAtEndpoint', () => {
  it('duplicates the first endpoint and inserts the copy at the start', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);

    const result = extendLineAtEndpoint(line, [0]);

    expect(result).toEqual({newVertexCoord: [0, 0], newVertexIndex: 0});
    expect(line.geometry.coordinates).toEqual([[0, 0], [0, 0], [10, 0]]);
  });

  it('duplicates the last endpoint and appends the copy at the end', () => {
    const line = turf.lineString([[0, 0], [10, 0]]);

    const result = extendLineAtEndpoint(line, [1]);

    expect(result).toEqual({newVertexCoord: [10, 0], newVertexIndex: 2});
    expect(line.geometry.coordinates).toEqual([[0, 0], [10, 0], [10, 0]]);
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
