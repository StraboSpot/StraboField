import {
  formatTilesSize, getFoundMapsMessage, getOfflineMap, getScreenFitZoom, getTileStats, parseTileNames,
} from './offlineMaps.helpers';
import {CUSTOM_MAP_SOURCES} from '../custom-maps/customMaps.constants';

describe('getOfflineMap', () => {
  const style = {id: 'geologist/abc123', source: CUSTOM_MAP_SOURCES.MAPBOX_STYLES};

  // Its tiles are saved under the style id alone, which is what looking it up by id missed
  it('finds a Mapbox style under its tile folder', () => {
    const offlineMap = {id: 'abc123', count: 40};
    expect(getOfflineMap({abc123: offlineMap}, style)).toBe(offlineMap);
  });

  it('finds a Mapbox style downloaded before offline maps were keyed by folder', () => {
    const offlineMap = {id: style.id, count: 40};
    expect(getOfflineMap({[style.id]: offlineMap}, style)).toBe(offlineMap);
  });

  it('finds any other map under its id', () => {
    const offlineMap = {id: 'mapbox.outdoors', count: 900};
    expect(getOfflineMap({'mapbox.outdoors': offlineMap}, {id: 'mapbox.outdoors'})).toBe(offlineMap);
  });

  it('finds nothing for a map that was never downloaded', () => {
    expect(getOfflineMap({}, style)).toBeUndefined();
  });
});

describe('parseTileNames', () => {
  it('reads the zoom, x and y out of each tile', () => {
    expect(parseTileNames(['12_851_1556.png', '3_1_2.png'])).toEqual([[12, 851, 1556], [3, 1, 2]]);
  });

  it('leaves out anything that is not a tile', () => {
    expect(parseTileNames(['.DS_Store', 'tiles.zip', '12_851_1556.png'])).toEqual([[12, 851, 1556]]);
  });
});

describe('getTileStats', () => {
  const files = [
    {name: '1_0_0.png', size: 1000},
    {name: '2_0_0.png', size: 2000},
    {name: '2_1_1.png', size: 3000},
    {name: '.DS_Store', size: 50},
  ];

  it('counts the tiles at each zoom', () => {
    expect(getTileStats(files).zoomCounts).toEqual({1: 1, 2: 2});
  });

  it('adds up the room every file takes', () => {
    expect(getTileStats(files).size).toBe(6050);
  });

  it('frames the tiles at the deepest zoom', () => {
    const [west, south, east, north] = getTileStats(files).bbox;
    expect(west).toBe(-180);
    expect(east).toBe(0);
    expect(north).toBeCloseTo(85.0511);
    expect(south).toBeCloseTo(0);
  });

  it('has no extent for a map with no tiles', () => {
    expect(getTileStats([])).toEqual({bbox: undefined, size: 0, zoomCounts: {}});
  });
});

describe('formatTilesSize', () => {
  it('picks the unit that keeps the number readable', () => {
    expect(formatTilesSize(2048)).toBe('2.0 KB');
    expect(formatTilesSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    expect(formatTilesSize(1.25 * 1024 * 1024 * 1024)).toBe('1.25 GB');
  });
});

describe('getScreenFitZoom', () => {
  // 1/256 of the world wide and far less than that high, so its width is what has to fit
  const wideExtent = [0, 0, 1.40625, 0.1];

  it('fits the whole world in one 512px square at zoom 0', () => {
    expect(getScreenFitZoom([-180, -85.0511, 180, 85.0511], 512, 512)).toBe(0);
  });

  it('goes one zoom deeper for each halving of the extent', () => {
    expect(getScreenFitZoom(wideExtent, 512, 512)).toBe(8);
    expect(getScreenFitZoom(wideExtent, 1024, 1024)).toBe(9);
  });

  it('fits the side that runs out of room first', () => {
    expect(getScreenFitZoom(wideExtent, 512, 10)).toBe(6);
  });

  it('rounds down, so the extent still fits', () => {
    expect(getScreenFitZoom(wideExtent, 1000, 1000)).toBe(8);
  });
});

describe('getFoundMapsMessage', () => {
  const noChanges = {added: 0, recounted: 0, removed: 0};

  it('says so when nothing changed', () => {
    expect(getFoundMapsMessage({...noChanges, mapCount: 3}))
      .toBe('Offline maps already up to date.');
  });

  it('lists each kind of change', () => {
    expect(getFoundMapsMessage({added: 1, mapCount: 4, recounted: 2, removed: 1}))
      .toBe('Offline maps updated: 1 added, 2 recounted, 1 removed.');
  });

  it('leaves out the kinds of change that did not happen', () => {
    expect(getFoundMapsMessage({...noChanges, added: 1, mapCount: 1})).toBe('Offline maps updated: 1 added.');
  });

  it('says when there are none', () => {
    expect(getFoundMapsMessage({...noChanges, mapCount: 0})).toBe('No offline maps found.');
  });

  it('says when the ones listed were removed because none are left', () => {
    expect(getFoundMapsMessage({...noChanges, mapCount: 0, removed: 2}))
      .toBe('No offline maps found. 2 removed.');
  });
});
