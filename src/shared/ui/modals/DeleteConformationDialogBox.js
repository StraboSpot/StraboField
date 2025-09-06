import React from 'react';
import {View} from 'react-native';

import overlayStyles from '../../ui/modals/overlay.styles';
import ModalWrapper from '../modals/ModalWrapper';

const DeleteConformationDialogBox = ({
                                       cancel,
                                       children,
                                       deleteOverlay,
                                       isVisible,
                                       headerTitle,
                                     }) => {
  return (
    <ModalWrapper
      actionTitle={'Delete'}
      headerTitle={headerTitle}
      isVisible={isVisible}
      onActionPressed={deleteOverlay}
      onCancelPress={cancel}
      shouldShowButtons
    >
      <View style={overlayStyles.overlayContent}>
        {children}
      </View>
    </ModalWrapper>
  );
};

export default DeleteConformationDialogBox;
