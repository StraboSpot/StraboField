import React, {useRef} from 'react';
import {Platform, ScrollView, Text} from 'react-native';

import {useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';

const ErrorModal = ({closeModal, children, isVisible}) => {
  const scrollView = useRef();

  const isErrorMessagesModalVisible = useSelector(state => state.home.isErrorMessagesModalVisible);
  const statusMessages = useSelector(state => state.home.statusMessages);

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      headerTitle={'Error!'}
      isVisible={isErrorMessagesModalVisible}
      onCancelPress={closeModal}
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
