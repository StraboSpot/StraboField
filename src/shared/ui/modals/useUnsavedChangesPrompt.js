import {useRef, useState} from 'react';
import {Platform} from 'react-native';

import {UNSAVED_CHANGES_CHOICES} from './unsavedChanges.constants';

// Asks what to do with unsaved changes and waits for the answer. The caller renders UnsavedChangesModal with
// promptProps and its own header and message.
const useUnsavedChangesPrompt = () => {
  /* Local State */

  const [isVisible, setIsVisible] = useState(false);
  // The prompt's answer, and the askAboutUnsavedChanges waiting for it
  const answerRef = useRef({choice: null, resolve: null});

  /* Internal Functions */

  const answer = () => {
    const {choice, resolve} = answerRef.current;
    answerRef.current = {choice: null, resolve: null};
    resolve?.(choice);
  };

  // iOS drops a modal opened while another is still closing, and the action waiting on the prompt may open one, so
  // on iOS the answer goes out once the prompt has closed (handleDismiss)
  const handleChoice = (choice) => {
    answerRef.current.choice = choice;
    setIsVisible(false);
    if (Platform.OS !== 'ios') answer();
  };

  const handleDismiss = () => {
    if (Platform.OS === 'ios') answer();
  };

  /* Exported Functions */

  // Resolves with one of UNSAVED_CHANGES_CHOICES. Asking again while the prompt is open, as a double tap or a web
  // double click does, answers the second ask with KEEP_EDITING so only the first caller goes on.
  const askAboutUnsavedChanges = () => new Promise((resolve) => {
    if (answerRef.current.resolve) {
      resolve(UNSAVED_CHANGES_CHOICES.KEEP_EDITING);
      return;
    }
    answerRef.current = {choice: UNSAVED_CHANGES_CHOICES.KEEP_EDITING, resolve};
    setIsVisible(true);
  });

  return {
    askAboutUnsavedChanges,
    promptProps: {isVisible, onChoose: handleChoice, onDismiss: handleDismiss},
  };
};

export default useUnsavedChangesPrompt;
