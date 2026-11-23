import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';

import * as Updates from 'expo-updates';

import alert from '../../shared/ui/alert';
import {persistor} from '../../store/ConfigureStore';

// The launch check covers a cold start; after that, look again on returning to the app at most this often
export const FOREGROUND_CHECK_INTERVAL_MS = 30 * 60 * 1000;

// Headless listener (mounted in App.js). expo-updates checks for an OTA update only at launch, but iOS and Android
// keep a backgrounded app suspended rather than closing it, so a launch can be days away. So check again whenever the
// app comes back to the foreground, and once an update has downloaded, offer to restart into it now. "Later" leaves
// it for the next launch and doesn't ask again about that update, so nobody is nagged in the middle of recording a
// Spot; a newer update published later is offered in turn.
const UpdatePromptListener = () => {
  const {downloadedUpdate, isUpdatePending} = Updates.useUpdates();
  const promptedUpdateIdRef = useRef(undefined);
  const lastCheckedRef = useRef(Date.now());

  useEffect(() => {
    if (!Updates.isEnabled) return;   // Off in debug builds, which load JS from Metro
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState !== 'active' || Date.now() - lastCheckedRef.current < FOREGROUND_CHECK_INTERVAL_MS) return;
      lastCheckedRef.current = Date.now();
      downloadNewUpdate();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const updateId = downloadedUpdate?.updateId;
    if (!isUpdatePending || promptedUpdateIdRef.current === updateId) return;
    promptedUpdateIdRef.current = updateId;
    alert('Update Ready',
      'A new version of StraboField has been downloaded. Restart now to start using it?\n\n'
      + 'Finish any edits you have open first.',
      [
        {text: 'Later', style: 'cancel'},
        {text: 'Restart', onPress: restartIntoUpdate},
      ],
    );
  }, [downloadedUpdate, isUpdatePending]);

  return null;
};

// Downloading sets isUpdatePending, which brings up the prompt above
export const downloadNewUpdate = async () => {
  try {
    const {isAvailable} = await Updates.checkForUpdateAsync();
    if (isAvailable) await Updates.fetchUpdateAsync();
  }
  catch (err) {
    console.warn('Could not check for an OTA update (offline?)', err);   // Expected in the field; try next time
  }
};

export const restartIntoUpdate = async () => {
  try {
    // Redux Persist writes on a short delay; write the latest state now so the reload can't drop the last change
    await persistor.flush();
    await Updates.reloadAsync();
  }
  catch (err) {
    console.error('Error restarting into the downloaded update', err);
  }
};

export default UpdatePromptListener;
