import React from 'react';
import {Text, View} from 'react-native';

import StatusDialogBox from '../../../shared/ui/StatusDialogBox';
import overlayStyles from '../../home/overlays/overlay.styles';

const OpenProjectModal = ({closeModal, openProject, saveProject}) => {

  return (
    <StatusDialogBox
      closeModal={closeModal}
      closeTitle={'Cancel'}
      confirmText={'Save'}
      isVisible={true}
      middleButtonPress={openProject}
      middleButtonTitle={'Don\'t Save'}
      onConfirmPress={saveProject}
      showCancelButton
      showConfirmButton
      showMiddleButton
      title={'Open Project'}
    >
      <View style={overlayStyles.overlayContent}>
        <Text style={overlayStyles.contentText}>Save current project first?</Text>
      </View>
    </StatusDialogBox>
  );
};

export default OpenProjectModal;
