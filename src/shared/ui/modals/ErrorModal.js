import React, {useRef} from 'react';
import {Platform, ScrollView, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';
import {setIsErrorMessagesModalVisible} from '../../../modules/home/home.slice';

const ErrorModal = ({children, headerTitle, isVisible, onActionPressed}) => {
  const scrollView = useRef(null);

  const dispatch = useDispatch();
  const isErrorMessagesModalVisible = useSelector(state => state.home.isErrorMessagesModalVisible);
  const statusMessages = useSelector(state => state.home.statusMessages);

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      headerTitle={headerTitle || 'Error!'}
      isVisible={isVisible || isErrorMessagesModalVisible}
      onActionPressed={onActionPressed || dispatch(setIsErrorMessagesModalVisible(false))}
      overlayStyleOverride={{
        paddingHorizontal: 0, // Set to 0 so the inner container controls spacing
        // Limits the total height of the white box
        maxHeight: 300,
      }}
      showActionButton={!(Platform.OS === 'web' && statusMessages.includes('Error loading project!'))}
      showCancelButton={false}
    >
      <View style={{
        paddingHorizontal: 10,
        // Allows the view to be as small as the content
        alignSelf: 'stretch',
        flexGrow: 0,
      }}>
        <ScrollView
          onContentSizeChange={() => scrollView.current.scrollToEnd({animated: true})}
          ref={scrollView}
          style={{flexGrow: 0}}
        >
          <Text style={overlayStyles.statusMessageText}>{children || statusMessages.join('\n')}</Text>
        </ScrollView>
      </View>

    </ModalWrapper>
  );
};

export default ErrorModal;
