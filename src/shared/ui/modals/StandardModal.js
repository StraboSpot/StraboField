import React from 'react';
import {Text, View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';

import overlayStyles from './overlay.styles';

const StandardModal = ({
                         children,
                         closeModal,
                         dialogTitle,
                         footerButtonsVisible,
                         leftButtonText,
                         onPress,
                         onTouchOutside,
                         rightButtonText,
                         visible,
                       }) => {
  return (
    <Overlay
      animationType={'fade'}
      isVisible={visible}
      onBackdropPress={onTouchOutside}
      overlayStyle={overlayStyles.overlayContainer}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={overlayStyles.titleContainer}>
        <Text style={overlayStyles.titleText}>{dialogTitle}</Text>
      </View>
      <View style={overlayStyles.overlayContent}>
        {children}
      </View>
      {footerButtonsVisible && (
        <View style={overlayStyles.buttonContainer}>
          <Button
            onPress={onPress}
            title={rightButtonText || 'OK'}
            titleStyle={overlayStyles.buttonText}
            type={'clear'}
          />
          <Button
            onPress={closeModal}
            title={leftButtonText || 'Cancel'}
            titleStyle={overlayStyles.buttonText}
            type={'clear'}
          />
        </View>
      )}
    </Overlay>
  );
};

export default StandardModal;
