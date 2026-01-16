import * as Sentry from '@sentry/react-native';

import alert from '../shared/ui/alert';
import {userAgent} from './userAgent';

export const handleError = async (response) => {
  if (response.status === 401) {
    const msg401 = 'This server could not verify that you are authorized to access the document requested. Either '
      + 'you supplied the wrong credentials (e.g., bad password), or your browser doesn\'t understand how to supply '
      + 'the credentials required.';
    return Promise.reject(msg401);
  }
  else if (response.status === 404) {
    const contentType = response.headers.get('content-type');
    if (contentType.includes('text/html')) {
      return Promise.reject('The requested URL was not found on this server.');
    }
    else {
      const responseJSON = await response.json();
      const errorMessage = responseJSON.error || responseJSON.Error;
      if (errorMessage) return Promise.reject(errorMessage);
    }
  }
  else if (response.status === 400) {
    return await response.json();
  }
  else {
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
  }
};

export const handleResponse = (response) => {
  if (response.ok && response.status === 204) return response.text() || 'no content';
  else if (response.ok) return response.json();
  else return handleError(response);
};

export const timeoutPromise = async (ms, promise) => {
  const timeoutPromiseException = (err) => {
    const timeoutError = Symbol();
    if (err === timeoutError) throw new Error('Network timeout');
    else throw 'Unable to Reach Server!';
  };

  let timer;
  return Promise.race([
    promise,
    new Promise((_r, rej) => timer = setTimeout(rej, ms))])
    .catch(timeoutPromiseException).finally(() => clearTimeout(timer));
};

export const post = async (baseUrl, urlPart, login, data) => {
  try {
    const response = await fetch(baseUrl + urlPart, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Authorization': 'Basic ' + login,
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
    });
    return handleResponse(response);
  }
  catch (err) {
    console.error('Error Posting', err);
    alert('Error', `${err.toString()}`);
  }
};

export const request = async (baseUrl, method, urlPart, login, ...otherParams) => {
  try {
    const response = await timeoutPromise(60000, fetch(baseUrl + urlPart, {
      method: method,
      headers: {
        'Authorization': 'Basic ' + login + '/',
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
      ...otherParams,
    }));
    return handleResponse(response);
  }
  catch (err) {
    console.error('Error Fetching', err);
    alert('Error', `${err.toString()}`);
    throw Error(err);
  }
};

export const requestMicro = async (domain, method, path, login, ...otherParams) => {
  try {
    const requestFetch = function () {
      return fetch(domain + path, {
        headers: {
          'Authorization': 'Basic ' + login,
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
        },
      });
    };

    const response = await timeoutPromise(60000, requestFetch(domain + path, {
      method: method,
      ...otherParams,
    }));
    return handleResponse(response);
  }
  catch (err) {
    console.error('Error Fetching', err);
    alert('Error', `${err.toString()}`);
    throw Error(err);
  }
};
