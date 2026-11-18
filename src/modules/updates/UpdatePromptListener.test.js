import React from 'react';

import * as Updates from 'expo-updates';
import ReactTestRenderer from 'react-test-renderer';

import UpdatePromptListener, {restartIntoUpdate} from './UpdatePromptListener';
import alert from '../../shared/ui/alert';
import {persistor} from '../../store/ConfigureStore';

jest.mock('expo-updates', () => ({useUpdates: jest.fn(), reloadAsync: jest.fn(() => Promise.resolve())}));
jest.mock('../../shared/ui/alert', () => jest.fn());
jest.mock('../../store/ConfigureStore', () => ({persistor: {flush: jest.fn(() => Promise.resolve())}}));

// An OTA update downloads in the background and only applies on a cold start, so once one is ready the user is
// offered a restart, once per session
describe('UpdatePromptListener', () => {
  let renderer;
  const renderWith = (isUpdatePending) => {
    Updates.useUpdates.mockReturnValue({isUpdatePending});
    ReactTestRenderer.act(() => {
      if (renderer) renderer.update(<UpdatePromptListener/>);
      else renderer = ReactTestRenderer.create(<UpdatePromptListener/>);
    });
  };

  beforeEach(() => {
    renderer = undefined;
    jest.clearAllMocks();
  });

  it('stays quiet while no update has finished downloading', () => {
    renderWith(false);
    expect(alert).not.toHaveBeenCalled();
  });

  it('offers a restart once an update is ready, and only once', () => {
    renderWith(false);
    renderWith(true);
    renderWith(true);
    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0][2];
    expect(buttons.map(({text}) => text)).toEqual(['Later', 'Restart']);
  });

  it('saves the store before reloading into the update', async () => {
    const order = [];
    persistor.flush.mockImplementation(async () => order.push('flush'));
    Updates.reloadAsync.mockImplementation(async () => order.push('reload'));
    await restartIntoUpdate();
    expect(order).toEqual(['flush', 'reload']);
  });
});
