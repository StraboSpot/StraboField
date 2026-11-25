import React from 'react';
import {AppState} from 'react-native';

import * as Updates from 'expo-updates';
import ReactTestRenderer from 'react-test-renderer';

import UpdatePromptListener, {downloadNewUpdate, FOREGROUND_CHECK_INTERVAL_MS} from './UpdatePromptListener';
import alert from '../../shared/ui/alert';
import {persistor} from '../../store/ConfigureStore';

jest.mock('expo-updates', () => ({
  isEnabled: true,
  useUpdates: jest.fn(),
  checkForUpdateAsync: jest.fn(() => Promise.resolve({isAvailable: false})),
  fetchUpdateAsync: jest.fn(() => Promise.resolve({isNew: true})),
  reloadAsync: jest.fn(() => Promise.resolve()),
}));
const mockAutoSaveNow = jest.fn(() => Promise.resolve({hasFailed: false, hasSaved: true}));
jest.mock('../../services/files/useAutoSave', () => ({
  useAutoSaveNow: () => ({autoSaveNow: mockAutoSaveNow}),
}));
jest.mock('../../shared/ui/alert', () => jest.fn());
let mockIsMapEditing = false;
jest.mock('react-redux', () => ({useSelector: selector => selector({map: {isMapEditing: mockIsMapEditing}})}));
let mockOpenProject;
jest.mock('../../store/ConfigureStore', () => ({
  persistor: {flush: jest.fn(() => Promise.resolve())},
  store: {getState: () => ({project: {project: mockOpenProject}})},
}));

// An OTA update downloads in the background and only applies on a cold start, so once one is ready the user is
// offered a restart, once per update
describe('UpdatePromptListener', () => {
  let renderer, onAppStateChange, now;
  // Async so the backup made before the prompt settles and the prompt is up
  const renderWith = async (isUpdatePending, updateId) => {
    Updates.useUpdates.mockReturnValue({isUpdatePending, downloadedUpdate: updateId && {updateId}});
    await ReactTestRenderer.act(async () => {
      if (renderer) renderer.update(<UpdatePromptListener/>);
      else renderer = ReactTestRenderer.create(<UpdatePromptListener/>);
    });
  };

  beforeEach(() => {
    renderer = undefined;
    mockIsMapEditing = false;
    jest.clearAllMocks();
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    jest.spyOn(AppState, 'addEventListener').mockImplementation((type, handler) => {
      onAppStateChange = handler;
      return {remove: jest.fn()};
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('stays quiet while no update has finished downloading', async () => {
    await renderWith(false);
    expect(alert).not.toHaveBeenCalled();
    expect(mockAutoSaveNow).not.toHaveBeenCalled();
  });

  it('offers a restart once an update is ready, and only once', async () => {
    await renderWith(false);
    await renderWith(true, 'update-1');
    await renderWith(true, 'update-1');
    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0][2];
    expect(buttons.map(({text}) => text)).toEqual(['Later', 'Restart']);
  });

  // Whichever the user picks then, nothing more needs saving
  it('backs up the project before the prompt shows and says so', async () => {
    const order = [];
    mockOpenProject = {description: {project_name: 'Field Trip'}};
    mockAutoSaveNow.mockImplementationOnce(async () => {
      order.push('autoSave');
      return {hasFailed: false, hasSaved: true};
    });
    alert.mockImplementationOnce(() => order.push('prompt'));
    await renderWith(true, 'update-1');
    expect(order).toEqual(['autoSave', 'prompt']);
    expect(alert.mock.calls[0][1]).toContain('Your project was just auto-saved to the device.');
  });

  it('doesn\'t claim a new auto save when the project had no changes', async () => {
    mockOpenProject = {description: {project_name: 'Field Trip'}};
    mockAutoSaveNow.mockResolvedValueOnce({hasFailed: false, hasSaved: false});
    await renderWith(true, 'update-1');
    expect(alert.mock.calls[0][1]).toContain('no changes since its last auto save');
    expect(alert.mock.calls[0][1]).not.toContain('just auto-saved');
  });

  it('points to a manual backup when the backup before the prompt fails', async () => {
    mockOpenProject = {description: {project_name: 'Field Trip'}};
    mockAutoSaveNow.mockResolvedValueOnce({hasFailed: true, hasSaved: false});
    await renderWith(true, 'update-1');
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][1]).toContain('couldn\'t be auto-saved');
    expect(alert.mock.calls[0][1]).toContain('Backup in the main menu');
  });

  it('says nothing about a backup when no project is open', async () => {
    mockOpenProject = {};
    await renderWith(true, 'update-1');
    expect(alert.mock.calls[0][1]).not.toContain('auto');
  });

  it('waits for a map edit to be saved or canceled before backing up and prompting', async () => {
    mockIsMapEditing = true;
    await renderWith(true, 'update-1');
    expect(mockAutoSaveNow).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    mockIsMapEditing = false;
    await renderWith(true, 'update-1');
    expect(mockAutoSaveNow).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it('offers a newer update even after "Later" on an earlier one', async () => {
    await renderWith(true, 'update-1');
    await renderWith(true, 'update-2');
    expect(alert).toHaveBeenCalledTimes(2);
  });

  it('checks again on returning to the app, but no more often than the interval', async () => {
    await renderWith(false);
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

  const pressButton = async (text) => {
    await renderWith(true, 'update-1');
    return alert.mock.calls[0][2].find(button => button.text === text).onPress?.();
  };

  it('saves the store before reloading into the update, with no second backup', async () => {
    const order = [];
    persistor.flush.mockImplementation(async () => order.push('flush'));
    Updates.reloadAsync.mockImplementation(async () => order.push('reload'));
    await pressButton('Restart');
    expect(order).toEqual(['flush', 'reload']);
    expect(mockAutoSaveNow).toHaveBeenCalledTimes(1);
  });

  it('stays on the current version on Later, with no second backup', async () => {
    await pressButton('Later');
    expect(Updates.reloadAsync).not.toHaveBeenCalled();
    expect(mockAutoSaveNow).toHaveBeenCalledTimes(1);
  });
});
