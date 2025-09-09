import React, {useRef} from 'react';
import {ScrollView, View} from 'react-native';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';


const StatusDialogBox = ({
                           children,
                           onCancelPress,
                           actionTitle,
                           disabled,
                           isVisible,
                           onActionPressed,
                           headerTitle,
                           showActionButton,
                           showCancelButton,
                         }) => {

  const scrollView = useRef();

  return (
    <ModalWrapper
      actionTitle={actionTitle || 'Ok'}
      disabled={disabled}
      headerTitle={headerTitle || 'Status'}
      isVisible={isVisible}
      onActionPressed={onActionPressed}
      onCancelPress={onCancelPress}
      showActionButton={showActionButton}
      showCancelButton={showCancelButton}
    >
      <ScrollView
        onContentSizeChange={() => scrollView.current.scrollToEnd({animated: true})}
        ref={scrollView}
      >
        <View style={overlayStyles.overlayContent}>
          {children}
        </View>
      </ScrollView>
    </ModalWrapper>
  );
};

export default StatusDialogBox;
