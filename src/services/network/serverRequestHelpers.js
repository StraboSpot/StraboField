import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';

import {userAgent} from './userAgent';
import {setIsSessionExpiredModalVisible} from '../../modules/home/home.slice';
import {isEmpty} from '../../shared/helpers';
import {store} from '../../store/ConfigureStore';

const DEFAULT_TIMEOUT = 60000;

/* Internal Functions */

const buildAuthHeader = (auth) => {
  if (!auth) return {};
  return {Authorization: `${auth.type === 'bearer' ? 'Bearer' : 'Basic'} ${auth.token}`};
};

/* -- 20260330 JMA
 const buildHeaders = (auth, customHeaders = {}) => ({
 'User-Agent': userAgent,
 ...buildAuthHeader(auth),
 ...customHeaders,
 });
 */

// User-Agent is a forbidden header in the browser Fetch API - the browser sets it and blocks any override - so
// only send it off the web.
const buildHeaders = (auth, customHeaders = {}) => ({
  ...(Platform.OS !== 'web' && {'User-Agent': userAgent}),
  ...buildAuthHeader(auth),
  ...customHeaders,
});

// Content-type is the authoritative signal; fall back to sniffing the body, since error pages are often served
// with a wrong or missing type. A leading '<' is HTML or XML - either way it is markup, not the data asked for.
const isMarkupBody = (response, text) => response.headers.get('content-type')?.includes('html')
  || text.trimStart().startsWith('<');

/* Exported Functions */

export const deleteRequest = async (url, auth) => {
  try {
    const response = await timeoutPromise(fetch(url, {method: 'DELETE', headers: buildHeaders(auth)}));
    return handleResponse(response, auth);
  }
  catch (err) {
    console.error(`Error DELETE: ${url}`, err);
    throw err;
  }
};

// What the user is told when a response body cannot be parsed. Status comes first: a 5xx or a timeout serves an
// HTML error page too, and blaming the address would send them looking for a problem that is not theirs.
export const describeUnreadableBody = (response, text) => {
  if (response.status === 408 || response.status === 504) return 'The server took too long to respond.';
  if (response.status >= 500) return 'The server is unavailable right now. Please try again shortly.';
  if (isMarkupBody(response, text)) {
    return 'The server returned a web page instead of data. The address may be wrong or the request was redirected.';
  }
  return 'The server returned a response that could not be read.';
};

/* -- 20260330 JMA
 export const getRequest = async (url, auth, options = {}) => {
 const {responseType, ...headerOptions} = options;
 try {
 const response = await timeoutPromise(fetch(url, {method: 'GET', headers: buildHeaders(auth, headerOptions)}));
 return isEmpty(options) ? handleResponse(response) : response;
 */

// `options` (e.g. {responseType: 'blob'}) only flags whether to hand back the raw response. It must not reach
// buildHeaders, which would spread it into the request and send `responsetype: blob` as a header, tripping CORS.
export const getRequest = async (url, auth, options = {}) => {
  try {
    const response = await timeoutPromise(fetch(url, {method: 'GET', headers: buildHeaders(auth)}));
    return isEmpty(options) ? handleResponse(response, auth) : response;
  }
  catch (err) {
    console.error(`Error GET: ${url}`, err);
    throw err;
  }
};

export const handleError = async (response, auth) => {
  const {status} = response;

  if (status === 401) {
    // A 401 means the stored Basic-Auth credentials are no longer valid (e.g. the user changed their
    // password on the website). Show the re-auth modal over the current screen instead of logging out —
    // that keeps the user on their map with their unsynced data intact rather than jarringly navigating
    // them back to the sign-in screen. Only trigger when the failing request actually carried the
    // credentials we still have stored: that excludes unauthenticated fetches, the sign-in endpoint
    // itself (a bad-password 401), and — crucially — stragglers left in flight with an old token when the
    // user has already re-authenticated (their token no longer matches the freshly-stored one), so
    // re-authenticating stays final and the modal does not pop back up.
    const {encoded_login: currentLogin, isAuthenticated} = store.getState().user;
    const usedCurrentCreds = !isEmpty(currentLogin) && auth?.token === currentLogin;
    if (isAuthenticated && usedCurrentCreds && !response.url?.includes('userAuthenticate')) {
      store.dispatch(setIsSessionExpiredModalVisible(true));
    }
    return Promise.reject(
      'This server could not verify that you are authorized to access the document requested. '
      + 'Either you supplied the wrong credentials (e.g., bad password), or your browser doesn\'t '
      + 'understand how to supply the credentials required.',
    );
  }

  const {isJson, json, text} = await readJsonBody(response);

  // A 400 carries the failure detail as its body, which the caller reads rather than treating as an error.
  if (status === 400) return isJson ? json : Promise.reject(describeUnreadableBody(response, text));

  if (status === 404) {
    if (isMarkupBody(response, text)) return Promise.reject('The requested URL was not found on this server.');
    const errorMessage = json?.error || json?.Error;
    if (errorMessage) return Promise.reject(errorMessage);
  }

  if (!isJson) {
    Sentry.captureMessage(`ERROR in useServerRequests: unreadable ${status} body from ${response.url}`);
    return Promise.reject(describeUnreadableBody(response, text));
  }
  // Match the 404 branch and accept either casing. Without a message, report what arrived instead, so these
  // do not all group in Sentry under "undefined".
  const errorMessage = json.Error || json.error;
  Sentry.captureMessage(errorMessage ? `ERROR in useServerRequests: ${errorMessage}`
    : `ERROR in useServerRequests: unexpected ${status} body from ${response.url}`);
  return Promise.reject(errorMessage || 'Unknown Error');
};

export const handleResponse = async (response, auth) => {
  if (!response.ok) return handleError(response, auth);
  // text() is a Promise so the fallback never fires; making it work would flip empty 204s from falsy to truthy.
  if (response.status === 204) return response.text() || 'no content';

  // Parse the text rather than calling response.json(): a 2xx carrying a non-JSON body - typically an HTML error
  // or sign-in page served in place of data - otherwise surfaces as "Unexpected character: <", naming neither the
  // request nor the cause.
  const {isJson, json, text} = await readJsonBody(response);
  return isJson ? json : Promise.reject(describeUnreadableBody(response, text));
};

export const postFormDataRequest = async (url, formData, auth) => {
  try {
    const response = await timeoutPromise(fetch(url, {
      method: 'POST',
      headers: buildHeaders(auth),
      body: formData,
    }));
    return handleResponse(response, auth);
  }
  catch (err) {
    console.error(`Error POST (FormData): ${url}`, err);
    throw err;
  }
};

export const postRequest = async (url, body, auth, customHeaders = {}, timeout = DEFAULT_TIMEOUT) => {
  try {
    console.log('POST', url, body, auth, customHeaders, timeout);
    const response = await timeoutPromise(fetch(url, {
      method: 'POST',
      headers: buildHeaders(auth, isEmpty(customHeaders) ? {'Content-Type': 'application/json'} : customHeaders),
      body: isEmpty(customHeaders) ? JSON.stringify(body) : body,
    }), timeout);
    return isEmpty(customHeaders) ? handleResponse(response, auth) : response;
  }
  catch (err) {
    console.error(`Error POST: ${url}`, err);
    throw err;
  }
};

// Read the body once and parse it without throwing. A response body can only be read once, so the text comes back
// alongside the result for callers that need to inspect what arrived instead of JSON.
export const readJsonBody = async (response) => {
  const text = await response.text();
  try {
    return {isJson: true, json: JSON.parse(text), text};
  }
  catch (err) {
    console.error(`Non-JSON response from ${response.url}`, err, text.slice(0, 300));
    return {isJson: false, text};
  }
};

export const timeoutPromise = (promise, timeout = DEFAULT_TIMEOUT) => {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Network timeout')), timeout);
    }),
  ]).finally(() => clearTimeout(timer));
};
