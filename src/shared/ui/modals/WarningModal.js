import React from 'react';
import {Dimensions, Platform, Text} from 'react-native';

import {useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';

const platform = Platform.OS === 'ios' ? 'window' : 'screen';
const {height} = Dimensions.get(platform);

const WarningModal = ({
                        cancelTitle,
                        children,
                        closeModal,
                        confirmText,
                        isVisible,
                        onCancelPress,
                        onConfirmPress,
                        showCancelButton,
                        showCloseButton,
                        showConfirmButton,
                        title,
                      }) => {
  /* Data Hooks */

  const statusMessages = useSelector(state => state.home.statusMessages);

  /* View */

  return (
    <ModalWrapper
      actionTitle={confirmText || 'Ok'}
      cancelTitle={cancelTitle || 'Cancel'}
      closeModal={closeModal}
      headerTitle={title || 'Warning!'}
      isVisible={isVisible}
      onActionPressed={onConfirmPress}
      onCancelPress={onCancelPress}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton={showConfirmButton}
      showCancelButton={showCancelButton}
      showCloseButton={showCloseButton}
    >
      <Text style={overlayStyles.statusMessageText}>{children || statusMessages.join('\n')}</Text>
    </ModalWrapper>
  );
};

export default WarningModal;
