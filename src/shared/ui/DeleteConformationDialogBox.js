import React from 'react';
import {View} from 'react-native';

import ModalWrapper from './modal/ModalWrapper';
import overlayStyles from '../../modules/home/overlays/overlay.styles';

const DeleteConformationDialogBox = ({
                                       cancel,
                                       children,
                                       deleteOverlay,
                                       isVisible,
                                       title,
                                     }) => {
  return (
    <ModalWrapper
      isVisible={isVisible}
      onCancelPress={cancel}
      onSavePress={deleteOverlay}
      title={title}
      titleText={'Delete'}
    >
      <View style={overlayStyles.overlayContent}>
        {children}
      </View>
    </ModalWrapper>
  );
};

export default DeleteConformationDialogBox;
