import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';

import {userAgent} from './userAgent';
import {isEmpty} from '../../shared/Helpers';

const DEFAULT_TIMEOUT = 300000;  // 5 min

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

/*
 User-Agent is a forbidden header in the browser Fetch API — the browser sets it automatically and does not allow JavaScript to override it.
 */
const buildHeaders = (auth, customHeaders = {}) => ({
  ...(Platform.OS !== 'web' && {'User-Agent': userAgent}),
  ...buildAuthHeader(auth),
  ...customHeaders,
});

/* Exported Functions */

export const deleteRequest = async (url, auth) => {
  try {
    const response = await timeoutPromise(fetch(url, {method: 'DELETE', headers: buildHeaders(auth)}));
    return handleResponse(response);
  }
  catch (err) {
    console.error(`Error DELETE: ${url}`, err);
    throw err;
  }
};

/* -- 20260330 JMA
 export const getRequest = async (url, auth, options = {}) => {
 const {responseType, ...headerOptions} = options;
 try {
 const response = await timeoutPromise(fetch(url, {method: 'GET', headers: buildHeaders(auth, headerOptions)}));
 return isEmpty(options) ? handleResponse(response) : response;
 */

/*
 `options` (e.g. {responseType: 'blob'}) was being passed as the `customHeaders` argument to buildHeaders(),
 which spread it into the HTTP headers. This sent `responsetype: blob` as an actual HTTP header, triggering a CORS
 */
export const getRequest = async (url, auth, options = {}) => {
  try {
    const response = await timeoutPromise(fetch(url, {method: 'GET', headers: buildHeaders(auth)}));
    return isEmpty(options) ? handleResponse(response) : response;
  }
  catch (err) {
    console.error(`Error GET: ${url}`, err);
    throw err;
  }
};

export const handleError = async (response) => {
  const {status, headers} = response;

  if (status === 400) return response.json();

  if (status === 401) {
    return Promise.reject(
      'This server could not verify that you are authorized to access the document requested. '
      + 'Either you supplied the wrong credentials (e.g., bad password), or your browser doesn\'t '
      + 'understand how to supply the credentials required.',
    );
  }

  if (status === 404) {
    if (headers.get('content-type')?.includes('text/html')) {
      return Promise.reject('The requested URL was not found on this server.');
    }
    const responseJSON = await response.json();
    const errorMessage = responseJSON.error || responseJSON.Error;
    if (errorMessage) return Promise.reject(errorMessage);
  }

  try {
    const errorMessage = JSON.parse(await response.text());
    Sentry.captureMessage(`ERROR in useServerRequests: ${errorMessage.Error}`);
    return Promise.reject(errorMessage?.Error || 'Unknown Error');
  }
  catch (err) {
    console.error(err);
    Sentry.captureMessage(`ERROR in useServerRequests: ${JSON.stringify(response)}`);
    return Promise.reject('Unable to parse response. ' + err);
  }
};

export const handleResponse = (response) => {
  if (response.ok && response.status === 204) return response.text() || 'no content';
  if (response.ok) return response.json();
  return handleError(response);
};

export const postFormDataRequest = async (url, formData, auth) => {
  try {
    const response = await timeoutPromise(fetch(url, {
      method: 'POST',
      headers: buildHeaders(auth),
      body: formData,
    }));
    return handleResponse(response);
  }
  catch (err) {
    console.error(`Error POST (FormData): ${url}`, err);
    throw err;
  }
};

export const postRequest = async (url, body, auth, customHeaders = {}) => {
  try {
    const response = await timeoutPromise(fetch(url, {
      method: 'POST',
      headers: buildHeaders(auth, isEmpty(customHeaders) ? {'Content-Type': 'application/json'} : customHeaders),
      body: isEmpty(customHeaders) ? JSON.stringify(body) : body,
    }));
    return isEmpty(customHeaders) ? handleResponse(response) : response;
  }
  catch (err) {
    console.error(`Error POST: ${url}`, err);
    throw err;
  }
};

export const timeoutPromise = (promise) => {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Network timeout')), DEFAULT_TIMEOUT);
    }),
  ]).finally(() => clearTimeout(timer));
};
