import {CUSTOM_MAP_SOURCES} from './customMaps.constants';
import {canReachMapTiles, getCustomMapsForDatabase, isOfflineMapOverlayOn} from './customMaps.helpers';

const style = {id: 'geologist/abc123', source: CUSTOM_MAP_SOURCES.MAPBOX_STYLES};
const myMap = {id: '5f1e2a', source: CUSTOM_MAP_SOURCES.STRABO_MY_MAPS};
const localMyMap = {
  id: 'local1',
  source: CUSTOM_MAP_SOURCES.STRABO_MY_MAPS,
  url: ['http://10.0.0.5/geotiff/tiles/'],
};

// A downloaded map is keyed by its tile folder, which drops a Mapbox style's account prefix
const downloaded = map => ({id: map.id.split('/').pop(), source: 'direct from filesystem', count: 12});

describe('isOfflineMapOverlayOn', () => {
  it('reads the switch from the project for one of its own maps', () => {
    const customMaps = {[style.id]: {...style, overlay: true, isViewable: true}};
    const offlineMaps = {abc123: downloaded(style)};
    expect(isOfflineMapOverlayOn(customMaps, offlineMaps, offlineMaps.abc123)).toBe(true);
  });

  // The downloaded copy can carry a flag copied from the project when it was saved; the project's switch wins
  it('ignores a stale flag on the download of a project map that is switched off', () => {
    const customMaps = {[style.id]: {...style, overlay: false, isViewable: false}};
    const offlineMaps = {abc123: {...downloaded(style), overlay: true, isViewable: true}};
    expect(isOfflineMapOverlayOn(customMaps, offlineMaps, offlineMaps.abc123)).toBe(false);
  });

  it('reads the switch from the download for a map from another project', () => {
    const offlineMaps = {[myMap.id]: {...downloaded(myMap), overlay: true, isViewable: true}};
    expect(isOfflineMapOverlayOn({}, offlineMaps, offlineMaps[myMap.id])).toBe(true);
  });

  it('is off for a map that has never been switched on', () => {
    const offlineMaps = {[myMap.id]: downloaded(myMap)};
    expect(isOfflineMapOverlayOn({}, offlineMaps, offlineMaps[myMap.id])).toBe(false);
  });
});

describe('getCustomMapsForDatabase', () => {
  const hostedMyMap = {...myMap, url: ['https://strabospot.org/geotiff/tiles/']};
  const httpsLocalMyMap = {...localMyMap, id: 'local2', url: ['https://maps.lab.edu/geotiff/tiles/']};
  const mapboxStyle = {...style, url: ['https://api.mapbox.com/styles/v1/']};
  const customMaps = Object.fromEntries(
    [hostedMyMap, localMyMap, httpsLocalMyMap, mapboxStyle].map(map => [map.id, map]));

  // Any address that is not strabospot.org's, whether or not it is a 192. one or served over http
  it('lists only a custom server\'s maps while one is selected', () => {
    expect(getCustomMapsForDatabase(customMaps, true)).toEqual([localMyMap, httpsLocalMyMap]);
  });

  it('lists every other map otherwise', () => {
    expect(getCustomMapsForDatabase(customMaps, false)).toEqual([hostedMyMap, mapboxStyle]);
  });

  // A map saved without a url cannot be placed on any server, so it stays with strabospot.org's
  it('keeps a map with no url out of a custom server\'s list', () => {
    const noUrl = {id: 'old', source: CUSTOM_MAP_SOURCES.STRABO_MY_MAPS};
    expect(getCustomMapsForDatabase({old: noUrl}, true)).toEqual([]);
  });
});

describe('canReachMapTiles', () => {
  const lanOnly = {isConnected: true, isInternetReachable: false};

  it('reaches a custom server\'s map over a network with no internet', () => {
    expect(canReachMapTiles(localMyMap, lanOnly)).toBe(true);
  });

  // Whichever database is selected, a Mapbox style and a default basemap are on the internet
  it('does not reach a Mapbox style or a default basemap without the internet', () => {
    expect(canReachMapTiles(style, lanOnly)).toBe(false);
    expect(canReachMapTiles({id: 'mapbox.outdoors'}, lanOnly)).toBe(false);
  });

  it('reaches nothing with no network', () => {
    expect(canReachMapTiles(localMyMap, {isConnected: false, isInternetReachable: false})).toBe(false);
  });
});
