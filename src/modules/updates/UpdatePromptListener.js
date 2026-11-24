import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';

import * as Updates from 'expo-updates';

import {isAutoSaveNeeded, useAutoSaveNow} from '../../services/files/useAutoSave';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {persistor, store} from '../../store/ConfigureStore';
import {MAIN_MENU_ITEMS} from '../main-menu-panel/mainMenu.constants';

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

  const {autoSaveNow} = useAutoSaveNow();

  // The prompt promised a backup, so a failed one is the user's call. Nothing is lost without it: the project is in
  // the store, which is written below and carries over, as an update replaces only the app's code.
  const confirmRestartWithoutBackup = () => new Promise((resolve) => {
    alert('Backup Failed',
      'A backup of your project couldn\'t be saved to the device. Your project is still on the device and carries'
      + ' over to the new version.',
      [
        {onPress: () => resolve(false), style: 'cancel', text: 'Cancel'},
        {onPress: () => resolve(true), text: 'Restart Anyway'},
      ]);
  });

  const restartIntoUpdate = async () => {
    try {
      const {hasFailed} = await autoSaveNow();
      if (hasFailed && !await confirmRestartWithoutBackup()) return;
      // Redux Persist writes on a short delay; write the latest state now so the reload can't drop the last change
      await persistor.flush();
      await Updates.reloadAsync();
    }
    catch (err) {
      console.error('Error restarting into the downloaded update', err);
    }
  };

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
    const isProjectOpen = !isEmpty(store.getState().project.project);
    // After "Later" the update applies on the next launch, which makes no backup, so point the user to their own
    const laterBackupNote = isProjectOpen ? ', so when you\'re done, save a backup of your project first from'
      + ` ${MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP} in the main menu` : '';
    // Restart backs up the open project first, but only if it has changed; say which, so neither case is a surprise
    const restartBackupNote = !isProjectOpen ? ''
      : isAutoSaveNeeded() ? ' A backup of your project\'s changes is automatically saved to the device first.'
        : ' Your project has no changes since its last backup, so no backup is needed.';
    alert('Update Ready',
      'A new version of StraboField has been downloaded.\n\n'
      + 'If you\'re in the middle of an edit, tap Later to keep working. The new version is used the next time'
      + ` StraboField opens${laterBackupNote}.\n\n`
      + `Otherwise, tap Restart to close and reopen StraboField with the new version.${restartBackupNote}`,
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

export default UpdatePromptListener;
