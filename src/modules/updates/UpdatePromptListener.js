import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';

import * as Updates from 'expo-updates';
import {useSelector} from 'react-redux';

import {useAutoSaveNow} from '../../services/files/useAutoSave';
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
  const isMapEditing = useSelector(state => state.map.isMapEditing);
  const promptedUpdateIdRef = useRef(undefined);
  const lastCheckedRef = useRef(Date.now());

  const {autoSaveNow} = useAutoSaveNow();

  // Backed up before the prompt shows, so the project is safe whichever the user picks: Restart reloads now and
  // Later on the next launch, and neither makes a backup of its own
  const showUpdatePrompt = async () => {
    const {hasFailed, hasSaved} = await autoSaveNow();
    const isProjectOpen = !isEmpty(store.getState().project.project);
    // With no changes since the last auto save, none is made, so don't claim a new one
    const backupNote = !isProjectOpen ? ''
      : hasFailed ? '\n\nYour project couldn\'t be auto-saved to the device. Save a backup from'
        + ` ${MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP} in the main menu.`
        : hasSaved ? '\n\nYour project was just auto-saved to the device.'
          : '\n\nYour project has no changes since its last auto save.';
    alert('Update Ready',
      'A new version of StraboField is ready. Restart to use it now, or tap Later to use it the next time'
      + ` StraboField opens.${backupNote}`,
      [
        {text: 'Later', style: 'cancel'},
        {text: 'Restart', onPress: restartIntoUpdate},
      ],
    );
  };

  const restartIntoUpdate = async () => {
    try {
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
    // A Spot being drawn or edited on the map isn't saved yet, so the backup made before the prompt wouldn't keep it.
    // Wait for the user to save or cancel it; this runs again then.
    if (!isUpdatePending || isMapEditing || promptedUpdateIdRef.current === updateId) return;
    promptedUpdateIdRef.current = updateId;
    showUpdatePrompt();
  }, [downloadedUpdate, isMapEditing, isUpdatePending]);

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
