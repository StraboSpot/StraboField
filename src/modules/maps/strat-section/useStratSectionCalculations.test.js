import React from 'react';

import {act, create} from 'react-test-renderer';

import useStratSectionCalculations from './useStratSectionCalculations';

const mockDispatch = jest.fn();
let mockState;
let mockSpotsOnSection;

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockState),
}));
jest.mock('../../spots/useSpots', () => () => ({
  getAllIntervalSpotsOnStratSection: () => mockSpotsOnSection.filter(s => s.geometry.type === 'Polygon'),
  getAllSpotsOnStratSection: () => mockSpotsOnSection,
}));

// Coordinates in the order reorderInterval writes them: 0, 3 and 4 at the bottom, 1 and 2 at the top
const makeInterval = (id, minY, maxY) => ({
  geometry: {coordinates: [[[0, minY], [0, maxY], [10, maxY], [10, minY], [0, minY]]], type: 'Polygon'},
  properties: {id: id, strat_section_id: 9},
  type: 'Feature',
});
const makePoint = (id, y) => ({
  geometry: {coordinates: [5, y], type: 'Point'},
  properties: {id: id, strat_section_id: 9},
  type: 'Feature',
});

const getHook = () => {
  let hookApi;
  const Probe = () => {
    hookApi = useStratSectionCalculations();
    return null;
  };
  act(() => {
    create(<Probe/>);
  });
  return hookApi;
};

const getDispatchedSpots = () => mockDispatch.mock.calls
  .filter(([action]) => action.type === 'spot/editedOrCreatedSpots')
  .flatMap(([action]) => action.payload);
const getRecordedSpotIds = () => mockDispatch.mock.calls
  .filter(([action]) => action.type === 'map/addedIntervalDragChangedSpotIds')
  .flatMap(([action]) => action.payload);

beforeEach(() => mockDispatch.mockClear());

// Moving an interval shifts only the intervals between its old and new places. Saving the rest gives them a new
// timestamp and uploads them though nothing about them changed. Other Spots aren't moved at all, not even the point
// on C: a drag reorders intervals, and the user moves anything else by editing.
describe('reorderInterval', () => {
  it.each([
    // Stacked upward from 0: moving B above C shifts C down, and leaves A below and D above alone
    ['a section', {}, [[1, 0, 10], [2, 10, 20], [3, 20, 30], [4, 30, 40]], 25, {2: [20, 30], 3: [10, 20]}],
    // Stacked downward from 0: moving B below C shifts C up, and leaves A above and D below alone
    ['a core', {section_type: 'core'}, [[1, -10, 0], [2, -20, -10], [3, -30, -20], [4, -40, -30]], -25,
      {2: [-30, -20], 3: [-20, -10]}],
  ])('saves only the intervals it moves on %s', (name, stratSection, intervals, pointY, expectedMinMaxYById) => {
    mockState = {map: {isDragIntervalMode: true, stratSection: stratSection}};
    const [a, b, c, d] = intervals.map(([id, minY, maxY]) => makeInterval(id, minY, maxY));
    mockSpotsOnSection = [a, b, c, d, makePoint(5, pointY)];
    const {reorderInterval} = getHook();
    reorderInterval(b, c);
    const dispatched = getDispatchedSpots();
    expect(dispatched.map(s => s.properties.id).sort()).toEqual([2, 3]);
    expect(getRecordedSpotIds().sort()).toEqual([2, 3]);
    dispatched.forEach((spot) => {
      const ys = spot.geometry.coordinates[0].map(([, y]) => y);
      expect([Math.min(...ys), Math.max(...ys)]).toEqual(expectedMinMaxYById[spot.properties.id]);
    });
  });
});
