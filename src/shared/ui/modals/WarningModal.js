import React from 'react';
import {Text} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';
import {setIsWarningMessagesModalVisible} from '../../../modules/home/home.slice';

const WarningModal = ({
                        children,
                        closeModal,
                        closeTitle,
                        confirmText,
                        confirmTitleStyle,
                        isVisible,
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
      actionTitle={confirmText || 'Ok'}
      headerTitle={title || 'Warning!'}
      isVisible={isVisible || isWarningModalVisible}
      onActionPressed={onConfirmPress || closeWarningModal}
      onCancelPress={closeModal}
      showActionButton={showConfirmButton}
      showCancelButton={showCancelButton}
    >
      <Text style={overlayStyles.statusMessageText}>{children || statusMessages.join('\n')}</Text>
    </ModalWrapper>
  );
};

export default WarningModal;
