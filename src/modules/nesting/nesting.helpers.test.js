import {getChildSpots, getGenerations, getParentSpots} from './nesting.helpers';

const makeSpot = (id, properties = {}, geometry) => ({type: 'Feature', geometry, properties: {id, ...properties}});

const square = (minX, minY, maxX, maxY) => ({
  type: 'Polygon',
  coordinates: [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]],
});

const point = (x, y) => ({type: 'Point', coordinates: [x, y]});

const toSpotsObj = spotsArray => Object.fromEntries(spotsArray.map(spot => [spot.properties.id, spot]));

const getIds = spotsArray => spotsArray.map(spot => spot.properties.id);

describe('getChildSpots', () => {
  it('finds the Spots on its image basemap and strat section among the searched Spots only', () => {
    const parent = makeSpot(1, {images: [{id: 10}], sed: {strat_section: {strat_section_id: 20}}});
    const onBasemap = makeSpot(2, {image_basemap: 10});
    const onSection = makeSpot(3, {strat_section_id: 20});
    const spots = toSpotsObj([parent, onBasemap, onSection]);

    expect(getIds(getChildSpots(parent, {activeSpots: [], searchedSpots: [onBasemap, onSection], spots})))
      .toEqual([2, 3]);
    expect(getChildSpots(parent, {activeSpots: [], searchedSpots: [], spots})).toEqual([]);
  });

  it('finds its samples and the Spots in its nesting list whether or not they are active', () => {
    const parent = makeSpot(1, {nesting: [3], samples: [{id: 2}]});
    const spots = toSpotsObj([parent, makeSpot(2, {isSample: true}), makeSpot(3)]);
    expect(getIds(getChildSpots(parent, {activeSpots: [], searchedSpots: [], spots}))).toEqual([2, 3]);
  });

  it('skips a sample or nesting list entry whose Spot is missing', () => {
    const parent = makeSpot(1, {nesting: [3], samples: [{id: 2}]});
    expect(getChildSpots(parent, {activeSpots: [], searchedSpots: [], spots: toSpotsObj([parent])})).toEqual([]);
  });

  it('finds the Spots within a polygon among the active Spots only', () => {
    const polygon = makeSpot(1, {}, square(0, 0, 10, 10));
    const inside = makeSpot(2, {}, point(5, 5));
    const outside = makeSpot(3, {}, point(50, 50));
    const spots = toSpotsObj([polygon, inside, outside]);

    expect(getIds(getChildSpots(polygon, {activeSpots: [polygon, inside, outside], searchedSpots: [], spots})))
      .toEqual([2]);
    expect(getChildSpots(polygon, {activeSpots: [], searchedSpots: [polygon, inside], spots})).toEqual([]);
  });

  it('does not nest by geometry across maps or with a sample', () => {
    const polygon = makeSpot(1, {}, square(0, 0, 10, 10));
    const onBasemap = makeSpot(2, {image_basemap: 10}, point(5, 5));
    const sample = makeSpot(3, {isSample: true}, point(5, 5));
    const activeSpots = [polygon, onBasemap, sample];
    expect(getChildSpots(polygon, {activeSpots, searchedSpots: [], spots: toSpotsObj(activeSpots)})).toEqual([]);
  });
});

describe('getParentSpots', () => {
  it('finds every Spot listing it in their nesting, not just the first', () => {
    const child = makeSpot(3);
    const allSpots = [makeSpot(1, {nesting: [3]}), makeSpot(2, {nesting: [3]}), child];
    expect(getIds(getParentSpots(child, {activeSpots: [], allSpots}))).toEqual([1, 2]);
  });

  it('finds the Spots holding its sample, image basemap and strat section among all Spots', () => {
    const sampleOwner = makeSpot(1, {samples: [{id: 4}]});
    const basemapOwner = makeSpot(2, {images: [{id: 10}]});
    const sectionOwner = makeSpot(3, {sed: {strat_section: {strat_section_id: 20}}});
    const sample = makeSpot(4, {image_basemap: 10, isSample: true, strat_section_id: 20});
    const allSpots = [sampleOwner, basemapOwner, sectionOwner, sample];
    expect(getIds(getParentSpots(sample, {activeSpots: [], allSpots}))).toEqual([1, 2, 3]);
  });

  it('leaves out a sample\'s missing parent instead of listing it as undefined', () => {
    const sample = makeSpot(4, {isSample: true});
    expect(getParentSpots(sample, {activeSpots: [], allSpots: [sample]})).toEqual([]);
  });

  it('finds the polygons it is within among the active Spots only', () => {
    const polygon = makeSpot(1, {}, square(0, 0, 10, 10));
    const inside = makeSpot(2, {}, point(5, 5));
    expect(getIds(getParentSpots(inside, {activeSpots: [polygon, inside], allSpots: []}))).toEqual([1]);
    expect(getParentSpots(inside, {activeSpots: [], allSpots: [polygon, inside]})).toEqual([]);
  });
});

describe('getGenerations', () => {
  const nextOf = links => spot => (links[spot.properties.id] || []).map(id => makeSpot(id));

  it('gives each generation in turn, stopping at the first empty one', () => {
    expect(getGenerations(makeSpot(1), 10, nextOf({1: [2], 2: [3]})).map(getIds)).toEqual([[2], [3]]);
  });

  it('stops at the number of levels asked for', () => {
    expect(getGenerations(makeSpot(1), 1, nextOf({1: [2], 2: [3]})).map(getIds)).toEqual([[2]]);
  });

  it('lists a Spot reached twice in the same generation once', () => {
    expect(getGenerations(makeSpot(1), 10, nextOf({1: [2, 3], 2: [4], 3: [4]})).map(getIds)).toEqual([[2, 3], [4]]);
  });

  it('lists a Spot only in the nearest generation it is found in', () => {
    expect(getGenerations(makeSpot(1), 10, nextOf({1: [2, 3], 2: [3]})).map(getIds)).toEqual([[2, 3]]);
  });

  it('never lists the Spot it started from, even when the nest loops back to it', () => {
    expect(getGenerations(makeSpot(1), 10, nextOf({1: [2], 2: [1]})).map(getIds)).toEqual([[2]]);
  });
});
