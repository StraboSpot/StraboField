import React from 'react';
import {AppState} from 'react-native';

import * as Updates from 'expo-updates';
import ReactTestRenderer from 'react-test-renderer';

import UpdatePromptListener, {
  downloadNewUpdate,
  FOREGROUND_CHECK_INTERVAL_MS,
  restartIntoUpdate,
} from './UpdatePromptListener';
import alert from '../../shared/ui/alert';
import {persistor} from '../../store/ConfigureStore';

jest.mock('expo-updates', () => ({
  isEnabled: true,
  useUpdates: jest.fn(),
  checkForUpdateAsync: jest.fn(() => Promise.resolve({isAvailable: false})),
  fetchUpdateAsync: jest.fn(() => Promise.resolve({isNew: true})),
  reloadAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../shared/ui/alert', () => jest.fn());
jest.mock('../../store/ConfigureStore', () => ({persistor: {flush: jest.fn(() => Promise.resolve())}}));

// An OTA update downloads in the background and only applies on a cold start, so once one is ready the user is
// offered a restart, once per update
describe('UpdatePromptListener', () => {
  let renderer, onAppStateChange, now;
  const renderWith = (isUpdatePending, updateId) => {
    Updates.useUpdates.mockReturnValue({isUpdatePending, downloadedUpdate: updateId && {updateId}});
    ReactTestRenderer.act(() => {
      if (renderer) renderer.update(<UpdatePromptListener/>);
      else renderer = ReactTestRenderer.create(<UpdatePromptListener/>);
    });
  };

  beforeEach(() => {
    renderer = undefined;
    jest.clearAllMocks();
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    jest.spyOn(AppState, 'addEventListener').mockImplementation((type, handler) => {
      onAppStateChange = handler;
      return {remove: jest.fn()};
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('stays quiet while no update has finished downloading', () => {
    renderWith(false);
    expect(alert).not.toHaveBeenCalled();
  });

  it('offers a restart once an update is ready, and only once', () => {
    renderWith(false);
    renderWith(true, 'update-1');
    renderWith(true, 'update-1');
    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0][2];
    expect(buttons.map(({text}) => text)).toEqual(['Later', 'Restart']);
  });

  it('offers a newer update even after "Later" on an earlier one', () => {
    renderWith(true, 'update-1');
    renderWith(true, 'update-2');
    expect(alert).toHaveBeenCalledTimes(2);
  });

  it('checks again on returning to the app, but no more often than the interval', () => {
    renderWith(false);
    onAppStateChange('active');   // Right after launch, which already checked
    expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();

    now += FOREGROUND_CHECK_INTERVAL_MS;
    onAppStateChange('background');
    expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
    onAppStateChange('active');
    expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);

    onAppStateChange('active');   // Throttled again
    expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
  });

  it('downloads an update only when one is available', async () => {
    await downloadNewUpdate();
    expect(Updates.fetchUpdateAsync).not.toHaveBeenCalled();

    Updates.checkForUpdateAsync.mockResolvedValueOnce({isAvailable: true});
    await downloadNewUpdate();
    expect(Updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
  });

  it('shrugs off a failed check, e.g. offline', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    Updates.checkForUpdateAsync.mockRejectedValueOnce(new Error('Network request failed'));
    await expect(downloadNewUpdate()).resolves.toBeUndefined();
  });

  it('saves the store before reloading into the update', async () => {
    const order = [];
    persistor.flush.mockImplementation(async () => order.push('flush'));
    Updates.reloadAsync.mockImplementation(async () => order.push('reload'));
    await restartIntoUpdate();
    expect(order).toEqual(['flush', 'reload']);
  });
});
