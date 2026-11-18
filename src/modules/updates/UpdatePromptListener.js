import {useEffect, useRef} from 'react';

import * as Updates from 'expo-updates';

import alert from '../../shared/ui/alert';
import {persistor} from '../../store/ConfigureStore';

// Headless listener (mounted in App.js). expo-updates downloads an OTA update in the background at launch and only
// switches to it on the next cold start, which in practice means the launch after next. Once a download has finished,
// offer to restart into it now. "Later" leaves it for the next launch and doesn't ask again this session, so nobody is
// nagged in the middle of recording a Spot.
const UpdatePromptListener = () => {
  const {isUpdatePending} = Updates.useUpdates();
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    if (!isUpdatePending || hasPromptedRef.current) return;
    hasPromptedRef.current = true;
    alert('Update Ready',
      'A new version of StraboField has been downloaded. Restart now to start using it?\n\n'
      + 'Finish any edits you have open first.',
      [
        {text: 'Later', style: 'cancel'},
        {text: 'Restart', onPress: restartIntoUpdate},
      ],
    );
  }, [isUpdatePending]);

  return null;
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
