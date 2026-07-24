import {getClosestSpotDistanceAndIndex} from './maps.helpers';

// Characterization tests: these pin the CURRENT behavior of the pure geometry helpers
// (bugs and quirks included) so a later refactor can be shown to preserve behavior. They are
// intentionally assertion-heavy on structure, not prose.

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
