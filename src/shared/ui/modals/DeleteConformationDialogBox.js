import React from 'react';
import {View} from 'react-native';

import overlayStyles from '../../ui/modals/overlay.styles';
import ModalWrapper from '../modals/ModalWrapper';

const DeleteConformationDialogBox = ({
                                       onCancelPress,
                                       children,
                                       onActionPressed,
                                       isVisible,
                                       headerTitle,
                                       overlayStyleOverride,
                                       doesRenderAsView,
                                       showActionButton,
                                     }) => {
  return (
    <ModalWrapper
      actionTitle={'Delete'}
      doesRenderAsView={doesRenderAsView}
      headerTitle={headerTitle}
      isVisible={isVisible}
      onActionPressed={onActionPressed}
      onCancelPress={onCancelPress}
      overlayStyleOverride={overlayStyleOverride}
      showActionButton={showActionButton}
    >
      <View style={overlayStyles.overlayContent}>
        {children}
      </View>
    </ModalWrapper>
  );
};

export default DeleteConformationDialogBox;
