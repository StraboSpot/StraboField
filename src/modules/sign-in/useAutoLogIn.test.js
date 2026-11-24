import React from 'react';

import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {Base64} from 'js-base64';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useAutoLogIn from './useAutoLogIn';
import homeReducer from '../home/home.slice';

const mockSignIn = jest.fn();
const mockInitializeDownload = jest.fn();

jest.mock('./useSignIn', () => () => ({signIn: mockSignIn}));
jest.mock('../../services/files/useDownload', () => () => ({initializeDownload: mockInitializeDownload}));

const renderHook = () => {
  const store = configureStore({reducer: combineReducers({home: homeReducer})});
  let hookApi;
  const Probe = () => {
    hookApi = useAutoLogIn();
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
  });
  return hookApi;
};

// The tests run without a DOM, so stand in for the page's address, its history and the tab's sessionStorage
const openUrl = (pathAndQuery) => {
  global.window.location = `https://field.example/${pathAndQuery}`;
};

const makeSessionStorage = () => {
  const items = new Map();
  return {getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, String(value))};
};

describe('useAutoLogIn', () => {
  beforeEach(() => {
    global.window = global.window || {};
    global.window.sessionStorage = makeSessionStorage();
    global.window.history = {
      state: null,
      replaceState: jest.fn((state, title, url) => {
        global.window.location = url;
      }),
    };
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockSignIn.mockReset().mockResolvedValue(undefined);
    mockInitializeDownload.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete global.window.location;
    delete global.window.history;
    delete global.window.sessionStorage;
    jest.restoreAllMocks();
  });

  it.each([
    // The link strabospot.org opens puts its parameters after the "#" route
    ['after the route', 'index.html#/app/manage-project?credentials=CRED&projectid=42&r=7',
      'index.html#/app/manage-project?projectid=42&r=7'],
    ['first in the query', '?credentials=CRED&projectid=42', '?projectid=42'],
    ['last in the query', '?projectid=42&credentials=CRED', '?projectid=42'],
    ['alone in the query', '?credentials=CRED', ''],
  ])('takes the credentials out of the address bar when they come %s, keeping the rest', async (name, before, after) => {
    openUrl(before.replace('CRED', Base64.encode('a@b.c*****pass')));
    await renderHook().autoLogIn();
    expect(mockSignIn).toHaveBeenCalledWith('a@b.c', 'pass');
    expect(global.window.location).toBe(`https://field.example/${after}`);
  });

  it('signs in again on a reload, with the credentials no longer in the address bar', async () => {
    openUrl(`?credentials=${Base64.encode('a@b.c*****pass')}&projectid=42`);
    await renderHook().autoLogIn();
    mockSignIn.mockClear();

    await renderHook().autoLogIn();  // The address bar now holds only ?projectid=42
    expect(mockSignIn).toHaveBeenCalledWith('a@b.c', 'pass');
  });

  it('uses the credentials of a newly opened link over ones stored by an earlier one', async () => {
    openUrl(`?credentials=${Base64.encode('a@b.c*****old')}&projectid=42`);
    await renderHook().autoLogIn();
    openUrl(`?credentials=${Base64.encode('a@b.c*****new')}&projectid=7`);
    await renderHook().autoLogIn();
    expect(mockSignIn).toHaveBeenLastCalledWith('a@b.c', 'new');
  });

  it('still signs in when the credentials cannot be stored, leaving them in the address bar', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.window.sessionStorage.setItem = () => {
      throw Error('Storage blocked');
    };
    const query = `?credentials=${Base64.encode('a@b.c*****pass')}&projectid=42`;
    openUrl(query);
    await renderHook().autoLogIn();
    expect(mockSignIn).toHaveBeenCalledWith('a@b.c', 'pass');
    expect(global.window.location).toBe(`https://field.example/${query}`);
  });

  it('signs in with the credentials in the URL, keeping non-ASCII characters, then loads the project', async () => {
    openUrl(`?credentials=${Base64.encode('jö@b.c*****pāss')}&projectid=42`);
    await renderHook().autoLogIn();
    expect(mockSignIn).toHaveBeenCalledWith('jö@b.c', 'pāss');
    expect(mockInitializeDownload).toHaveBeenCalledWith({id: '42'}, Base64.encode('jö@b.c:pāss'));
  });

  it('keeps a "+" in the Base64 credentials', async () => {
    const credentials = Base64.encode('a@b.c*****>>>');  // Encodes to Base64 containing "+"
    expect(credentials).toContain('+');
    openUrl(`?credentials=${credentials}&projectid=42`);
    await renderHook().autoLogIn();
    expect(mockSignIn).toHaveBeenCalledWith('a@b.c', '>>>');
  });

  it('fails without credentials in the URL', async () => {
    openUrl('?projectid=42');
    await expect(renderHook().autoLogIn()).rejects.toThrow('Credentials not found.');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('passes on a failed sign-in', async () => {
    mockSignIn.mockRejectedValue(new Error('Refused'));
    openUrl(`?credentials=${Base64.encode('a@b.c*****pass')}&projectid=42`);
    await expect(renderHook().autoLogIn()).rejects.toThrow('Refused');
    expect(mockInitializeDownload).not.toHaveBeenCalled();
  });
});
