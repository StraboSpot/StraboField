import React from 'react';
import {Text} from 'react-native';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';
import {UNSAVED_CHANGES_CHOICES} from './unsavedChanges.constants';
import {MAX_CONTENT_WIDTH} from '../../styles.constants';

// Asks what to do with unsaved changes before something else runs, with the same three choices wherever it is shown.
// The caller says what the changes are, and gets the rest from useUnsavedChangesPrompt's promptProps.
const UnsavedChangesModal = ({headerTitle, isVisible, message, onChoose, onDismiss}) => {
  const keepEditing = () => onChoose(UNSAVED_CHANGES_CHOICES.KEEP_EDITING);

  return (
    <ModalWrapper
      actionTitle={'Save'}
      cancelTitle={'Keep Editing'}
      closeModal={keepEditing}
      deleteTitle={'Discard'}
      headerTitle={headerTitle}
      isContentSized
      isVisible={isVisible}
      onActionPressed={() => onChoose(UNSAVED_CHANGES_CHOICES.SAVE)}
      onBackdropPress={keepEditing}
      onCancelPress={keepEditing}
      onDeletePress={() => onChoose(UNSAVED_CHANGES_CHOICES.DISCARD)}
      onDismiss={onDismiss}
      // Wider than a standard modal so the three buttons fit on one row
      overlayStyleOverride={{height: 'auto', maxWidth: '95%', width: MAX_CONTENT_WIDTH}}
      showDeleteButton
    >
      <Text style={overlayStyles.statusMessageText}>{message}</Text>
    </ModalWrapper>
  );
};

export default UnsavedChangesModal;
