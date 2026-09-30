import {getOfflineMap} from './offlineMaps.helpers';
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
