import {setCustomDatabaseUrl, setDatabaseIsSelected} from '../src/modules/connections/connections.slice';
import {getDeviceIdHeader} from '../src/services/network/serverRequests.helpers';
import {store} from '../src/store/ConfigureStore';

describe('getDeviceIdHeader', () => {
  const deviceHeader = () => ({'X-Strabo-Device': store.getState().connections.deviceId});

  afterEach(() => {
    store.dispatch(setCustomDatabaseUrl(''));
    store.dispatch(setDatabaseIsSelected(false));
  });

  it('identifies the device to StraboSpot', () => {
    expect(store.getState().connections.deviceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(getDeviceIdHeader('https://strabospot.org/db/project')).toEqual(deviceHeader());
    expect(getDeviceIdHeader('https://strabospot.org/microdb/projectPDF/1')).toEqual(deviceHeader());
  });

  it('keeps the device id from everyone else', () => {
    expect(getDeviceIdHeader('https://api.geosamples.org/api/samples/')).toEqual({});
    expect(getDeviceIdHeader('https://macrostrat.org/api/v2/mobile/point?lng=1&lat=2')).toEqual({});
    expect(getDeviceIdHeader('https://tiles.strabospot.org/zipcount')).toEqual({});
    expect(getDeviceIdHeader('https://strabospot.org.example.com/db/project')).toEqual({});
  });

  it('identifies the device to a custom server only while it is switched on', () => {
    store.dispatch(setCustomDatabaseUrl('http://192.168.1.20:8080/db'));
    expect(getDeviceIdHeader('http://192.168.1.20:8080/db/project')).toEqual({});
    store.dispatch(setDatabaseIsSelected(true));
    expect(getDeviceIdHeader('http://192.168.1.20:8080/db/project')).toEqual(deviceHeader());
  });
});
