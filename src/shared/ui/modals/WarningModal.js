import React from 'react';
import {Dimensions, Platform, Text} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import overlayStyles from './overlay.styles';
import ModalWrapper from './ModalWrapper';

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
  const dispatch = useDispatch();
  const statusMessages = useSelector(state => state.home.statusMessages);

  return (
    <ModalWrapper
      backdropStyle={{backgroundColor: 'rgba(0, 0, 0, 0.5)', height: height}}
      showCloseButton={showCloseButton}
      closeModal={closeModal}
      cancelTitle={cancelTitle || 'Cancel'}
      actionTitle={confirmText || 'Ok'}
      headerTitle={title || 'Warning!'}
      isVisible={isVisible}
      onActionPressed={onConfirmPress}
      onCancelPress={onCancelPress}
      showActionButton={showConfirmButton}
      showCancelButton={showCancelButton}
      overlayStyleOverride={{height: 'auto'}}
    >
      <Text style={overlayStyles.statusMessageText}>{children || statusMessages.join('\n')}</Text>
    </ModalWrapper>
  );
};

export default WarningModal;
