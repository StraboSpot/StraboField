import React from 'react';

import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {Base64} from 'js-base64';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useAuthentication from './useAuthentication.web';
import {AUTHENTICATION_ERROR_MESSAGE} from '../../services/network/serverRequests.helpers';
import connectionsReducer, {setOnlineStatus} from '../connections/connections.slice';
import userReducer, {logout, updatedKey} from '../user/userProfile.slice';

const CHECK_INTERVAL = 1000 * 60 * 5;

const mockServer = {authenticateUser: jest.fn()};

jest.mock('../../services/network/useServerRequests', () => () => mockServer);
jest.mock('../../store/ConfigureStore', () => ({store: {getState: () => ({})}}));

const renderHook = () => {
  const store = configureStore({
    preloadedState: {
      connections: {...connectionsReducer(undefined, {type: 'init'}), isOnline: {isInternetReachable: true}},
      user: {...userReducer(undefined, {type: 'init'}), encoded_login: Base64.encode('a@b.c:pāss:word'), isAuthenticated: true},
    },
    reducer: combineReducers({connections: connectionsReducer, user: userReducer}),
  });
  const Probe = () => {
    useAuthentication();
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
  });
  return store;
};

// Each lets the checks' awaited requests settle
const flush = () => ReactTestRenderer.act(async () => {});
const advance = ms => ReactTestRenderer.act(async () => jest.advanceTimersByTime(ms));

// The tests run without a DOM, so stand in for the one piece of document the hook uses
const setVisibility = visibilityState => ReactTestRenderer.act(async () => {
  global.document.visibilityState = visibilityState;
  global.document.dispatchEvent(new Event('visibilitychange'));
});

// Holds each check's reply until the test resolves it
const holdChecks = () => {
  const pendingChecks = [];
  mockServer.authenticateUser.mockImplementation(() => new Promise(resolve => pendingChecks.push(resolve)));
  return pendingChecks;
};

describe('useAuthentication (web)', () => {
  beforeEach(() => {
    global.document = Object.assign(new EventTarget(), {visibilityState: 'visible'});
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockServer.authenticateUser.mockReset();
    mockServer.authenticateUser.mockResolvedValue({valid: 'true'});
  });

  afterEach(() => {
    delete global.document;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('checks the stored credentials as they were encoded, splitting only at the first colon', async () => {
    renderHook();
    await flush();
    expect(mockServer.authenticateUser).toHaveBeenCalledWith('a@b.c', 'pāss:word');
  });

  it.each([
    ['stays signed in when the login passes', () => mockServer.authenticateUser.mockResolvedValue({valid: 'true'}), true],
    ['stays signed in when the check cannot reach the server',
      () => mockServer.authenticateUser.mockRejectedValue(new Error('Network timeout')), true],
    ['stays signed in when the server answers without a verdict',  // A 400's body resolves, not rejects
      () => mockServer.authenticateUser.mockResolvedValue({Error: 'Bad request'}), true],
    ['logs out when the server refuses the credentials',
      () => mockServer.authenticateUser.mockResolvedValue({valid: 'false'}), false],
    ['logs out on a 401 from the server',
      () => mockServer.authenticateUser.mockRejectedValue(AUTHENTICATION_ERROR_MESSAGE), false],
  ])('%s', async (name, setReply, isAuthenticated) => {
    setReply();
    const store = renderHook();
    await flush();
    expect(store.getState().user.isAuthenticated).toBe(isAuthenticated);
  });

  it('checks as soon as the tab is shown again, but not when it is hidden', async () => {
    renderHook();
    await flush();
    mockServer.authenticateUser.mockClear();

    await setVisibility('hidden');
    expect(mockServer.authenticateUser).not.toHaveBeenCalled();
    await setVisibility('visible');
    expect(mockServer.authenticateUser).toHaveBeenCalledTimes(1);
  });

  it('logs out when the tab comes back after the login expired', async () => {
    const store = renderHook();
    await flush();
    mockServer.authenticateUser.mockResolvedValue({valid: 'false'});

    await setVisibility('hidden');
    await setVisibility('visible');
    expect(store.getState().user.isAuthenticated).toBe(false);
  });

  it('drops a refusal for a login that has since been replaced', async () => {
    const pendingChecks = holdChecks();
    const store = renderHook();
    ReactTestRenderer.act(() => store.dispatch(updatedKey({encoded_login: Base64.encode('a@b.c:new'), isAuthenticated: true})));
    pendingChecks[1]({valid: 'true'});  // The new login passes...
    pendingChecks[0]({valid: 'false'});  // ...and the old one's refusal arrives after it
    await flush();
    expect(store.getState().user.isAuthenticated).toBe(true);
  });

  it('never signs in a user who is signed out', async () => {
    const store = renderHook();
    ReactTestRenderer.act(() => store.dispatch(logout()));
    await advance(CHECK_INTERVAL);
    expect(store.getState().user.isAuthenticated).toBe(false);
  });

  it('keeps one check loop however often the connection status changes', async () => {
    const pendingChecks = holdChecks();
    const store = renderHook();
    // Toggle the connection while the checks are still in flight
    ReactTestRenderer.act(() => store.dispatch(setOnlineStatus({isInternetReachable: false})));
    ReactTestRenderer.act(() => store.dispatch(setOnlineStatus({isInternetReachable: true})));
    pendingChecks.forEach(resolve => resolve({valid: 'true'}));
    await flush();
    mockServer.authenticateUser.mockReset();
    mockServer.authenticateUser.mockResolvedValue({valid: 'true'});

    await advance(CHECK_INTERVAL);
    expect(mockServer.authenticateUser).toHaveBeenCalledTimes(1);
  });

  it('skips the check while offline', async () => {
    const store = renderHook();
    await flush();
    ReactTestRenderer.act(() => store.dispatch(setOnlineStatus({isInternetReachable: false})));
    await flush();
    mockServer.authenticateUser.mockClear();
    await advance(CHECK_INTERVAL * 2);
    expect(mockServer.authenticateUser).not.toHaveBeenCalled();
  });
});
