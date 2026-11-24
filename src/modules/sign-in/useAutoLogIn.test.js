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

// The tests run without a DOM, so stand in for the page's address
const openUrl = (query) => {
  global.window.location = `https://field.example/${query}`;
};

describe('useAutoLogIn', () => {
  beforeEach(() => {
    global.window = global.window || {};
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockSignIn.mockReset().mockResolvedValue(undefined);
    mockInitializeDownload.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete global.window.location;
    jest.restoreAllMocks();
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
