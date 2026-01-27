import React from 'react';
import {Text} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';
import {setIsWarningMessagesModalVisible} from '../../../modules/home/home.slice';

const WarningModal = ({
                        cancelTitle,
                        children,
                        closeModal,
                        confirmText,
                        isVisible,
                        onCancelPress,
                        onConfirmPress,
                        showCancelButton,
                        showConfirmButton,
                        title,
                      }) => {
  const dispatch = useDispatch();
  const isWarningModalVisible = useSelector(state => state.home.isWarningMessagesModalVisible);
  const statusMessages = useSelector(state => state.home.statusMessages);

  const closeWarningModal = () => {
    dispatch(setIsWarningMessagesModalVisible(false));
  };

  return (
    <ModalWrapper
      backdropStyle={{opacity: 0.5, backgroundColor: 'black'}}
      overlayStyleOverride={{maxHeight: '25%'}}
      actionTitle={confirmText || 'Ok'}
      cancelTitle={cancelTitle || 'Cancel'}
      headerTitle={title || 'Warning!'}
      isVisible={isVisible || isWarningModalVisible}
      onActionPressed={onConfirmPress || closeWarningModal}
      onCancelPress={onCancelPress}
      showActionButton={showConfirmButton}
      showCancelButton={showCancelButton}
      showCloseButton
      closeModal={closeModal}
    >
      <Text style={overlayStyles.statusMessageText}>{children || statusMessages.join('\n')}</Text>
    </ModalWrapper>
  );
};

export default WarningModal;
