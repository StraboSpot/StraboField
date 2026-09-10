import React, {useState} from 'react';
import {Text, View} from 'react-native';

import styles from './sketch.styles';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';

// Asks whether a sketch drawn over an existing image should be kept as a second image or replace it.
// Rendered as a view rather than a modal since it is already inside the fullscreen sketch modal.
const SaveSketchModal = ({closeModal, onPressSaveAsCopy, onPressUpdate}) => {
  /* Local State */

  // Which of the two screens is showing. They share one ModalWrapper rather than the warning opening
  // its own, since a modal presented while another dismisses is dropped on iOS.
  const [isOverwriteWarningVisible, setIsOverwriteWarningVisible] = useState(false);

  /* Render Functions */

  // Updating overwrites the image file with no way back, so it takes a second, deliberate tap.
  // Cancel returns to the choices rather than closing, so the unsaved sketch is not lost.
  const renderOverwriteWarning = () => (
    <View style={overlayStyles.overlayContent}>
      <Text style={[overlayStyles.contentText, styles.warningText]}>
        Updating will overwrite the existing image. This cannot be undone.
      </Text>
      <ActionButton
        onPress={onPressUpdate}
        title={'  Update Existing  '}
      />
      <OutlineButton
        onPress={() => setIsOverwriteWarningVisible(false)}
        title={'      Cancel      '}
      />
    </View>
  );

  // Saving a copy is the safe choice, so it gets the filled button
  const renderSaveSketchChoices = () => (
    <View style={overlayStyles.overlayContent}>
      <Text style={overlayStyles.contentText}>
        Save this sketch as a copy or update the existing image?
      </Text>
      <ActionButton
        onPress={onPressSaveAsCopy}
        title={'  Save as Copy  '}
      />
      <OutlineButton
        onPress={() => setIsOverwriteWarningVisible(true)}
        title={'Update Existing'}
      />
    </View>
  );

  /* View */

  return (
    <ModalWrapper
      closeModal={closeModal}
      doesRenderAsView
      headerTitle={isOverwriteWarningVisible ? 'Warning!' : 'Save Sketch'}
      overlayStyleOverride={{maxHeight: '35%'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      {isOverwriteWarningVisible ? renderOverwriteWarning() : renderSaveSketchChoices()}
    </ModalWrapper>
  );
};

export default SaveSketchModal;
