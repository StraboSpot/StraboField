import * as Sentry from '@sentry/react-native';

import {setCustomDatabaseUrl, setDatabaseIsSelected} from '../src/modules/connections/connections.slice';
import {getDeviceIdHeader, handleResponse} from '../src/services/network/serverRequests.helpers';
import {store} from '../src/store/ConfigureStore';

const buildResponse = (body, {ok = true, status = 200, url = 'https://strabospot.org/db/projectdatasetsspots'} = {}) => ({
  ok: ok,
  status: status,
  url: url,
  headers: {get: () => 'text/html'},
  text: () => Promise.resolve(body),
});

const PHP_WARNING = '<br />\n<b>Warning</b>:  ERROR:  ON CONFLICT DO UPDATE command cannot affect row a second time\n'
  + 'HINT:  Ensure that no rows proposed for insertion within the same command have duplicate constrained values.'
  + ' in <b>/srv/app/www/strabo_db_postgresql.php</b> on line <b>198</b><br />\n';

describe('handleResponse', () => {
  it('reads the data out of a response a server warning was printed in front of', async () => {
    const json = await handleResponse(buildResponse(PHP_WARNING + '{"project":{"id":15838707577228}}'));
    expect(json).toEqual({project: {id: 15838707577228}});
  });

  it('reads a plain JSON body', async () => {
    expect(await handleResponse(buildResponse('{"project":{"id":1}}'))).toEqual({project: {id: 1}});
  });

  it('still refuses a body that is only a web page', async () => {
    await expect(handleResponse(buildResponse('<html><body>Sign in {not json}</body></html>'))).rejects
      .toBe('The server returned a web page instead of data. The address may be wrong or the request was redirected.');
  });
});

describe('handleError reporting', () => {
  const BAD_GATEWAY = '<html><body>502 Bad Gateway</body></html>';

  beforeEach(() => Sentry.captureMessage.mockClear());

  it('reports a failed StraboSpot request', async () => {
    await expect(handleResponse(buildResponse(BAD_GATEWAY, {ok: false, status: 502}))).rejects.toBeDefined();
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
  });

  it('does not report a failed request to someone else\'s server', async () => {
    const url = 'https://macrostrat.org/api/v2/mobile/point?lng=1&lat=2';
    await expect(handleResponse(buildResponse(BAD_GATEWAY, {ok: false, status: 502, url: url}))).rejects
      .toBe('The server is unavailable right now. Please try again shortly.');
    await expect(handleResponse(buildResponse('{"error":"No units"}', {ok: false, status: 500, url: url}))).rejects
      .toBe('No units');
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});

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
