import React, {useRef} from 'react';
import {Platform, ScrollView, Text} from 'react-native';

import {useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';

const ErrorModal = ({children, isVisible, onActionPressed}) => {
  const scrollView = useRef();

  const statusMessages = useSelector(state => state.home.statusMessages);

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      headerTitle={'Error!'}
      isVisible={isVisible}
      onActionPressed={onActionPressed}
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
