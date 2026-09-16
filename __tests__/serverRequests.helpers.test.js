import {handleResponse} from '../src/services/network/serverRequests.helpers';

const buildResponse = (body, {ok = true, status = 200} = {}) => ({
  ok: ok,
  status: status,
  url: 'https://strabospot.org/db/projectdatasetsspots',
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
