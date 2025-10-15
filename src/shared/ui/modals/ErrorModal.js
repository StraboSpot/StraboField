import React, {useRef} from 'react';
import {Platform, ScrollView, Text} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';
import {setIsErrorMessagesModalVisible} from '../../../modules/home/home.slice';

const ErrorModal = ({children, isVisible, closeModal, onActionPressed}) => {
  const scrollView = useRef();

  const dispatch = useDispatch();
  const isErrorMessagesModalVisible = useSelector(state => state.home.isErrorMessagesModalVisible);
  const statusMessages = useSelector(state => state.home.statusMessages);

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      headerTitle={'Error!'}
      isVisible={isVisible || isErrorMessagesModalVisible}
      onActionPressed={onActionPressed || dispatch(setIsErrorMessagesModalVisible(false))}
      showActionButton={!(Platform.OS === 'web' && statusMessages.includes('Error loading project!'))}
      showCancelButton={false}
    >
      <ScrollView
        onContentSizeChange={() => scrollView.current.scrollToEnd({animated: true})}
        ref={scrollView}
      >
        <Text style={overlayStyles.statusMessageText}>{children || statusMessages.join('\n')}</Text>
      </ScrollView>
    </ModalWrapper>
  );
};

export default ErrorModal;
