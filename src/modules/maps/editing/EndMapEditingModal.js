import React from 'react';
import {Text} from 'react-native';

import {MAP_EDIT_CHOICES} from './editing.constants';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';

// Asks what to do with unsaved map edits before something else runs. Shown by HomeContainer for useMapMode.
const EndMapEditingModal = ({isVisible, onChoose, onDismiss}) => {
  const continueEditing = () => onChoose(MAP_EDIT_CHOICES.CONTINUE_EDITING);

  return (
    <ModalWrapper
      actionTitle={'Save Edits'}
      cancelTitle={'Keep Editing'}
      closeModal={continueEditing}
      headerTitle={'Unsaved Map Edits'}
      isContentSized
      isVisible={isVisible}
      onActionPressed={() => onChoose(MAP_EDIT_CHOICES.SAVE)}
      onBackdropPress={continueEditing}
      onCancelPress={continueEditing}
      onDismiss={onDismiss}
      overlayStyleOverride={{height: 'auto'}}
    >
      <Text style={overlayStyles.statusMessageText}>Your map edits haven't been saved.</Text>
    </ModalWrapper>
  );
};

export default EndMapEditingModal;
