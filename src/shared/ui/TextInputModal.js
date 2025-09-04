import React from 'react';
import {Text, View} from 'react-native';

import {Button, Input, Overlay} from '@rn-vui/base';

import * as themes from '../styles.constants';
import overlayStyles from './modals/overlay.styles';

const TextInputModal = ({
                          autoCapitalize,
                          buttonText,
                          children,
                          closeModal,
                          dialogTitle,
                          errorMessage,
                          keyboardType,
                          multiline,
                          onChangeText,
                          onPress,
                          onSubmitEditing,
                          onTouchOutside,
                          overlayButtonText,
                          overlayTitleText,
                          placeholder,
                          renderErrorMessage,
                          style,
                          textAboveInput,
                          value,
                          visible,
                        }) => {
  return (
    <Overlay
      animationType={'fade'}
      backdropStyle={{backgroundColor: 'transparent'}}
      isVisible={visible}
      onBackdropPress={onTouchOutside}
      overlayStyle={[overlayStyles.overlayContainer]}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={[overlayStyles.titleContainer, style]}>
        <Text style={[overlayStyles.titleText, overlayTitleText]}>{dialogTitle}</Text>
      </View>
      <View>
        {textAboveInput}
        <Input
          autoCapitalize={autoCapitalize || 'none'}
          enterKeyHint={'done'}
          errorMessage={errorMessage}
          inputContainerStyle={overlayStyles.inputContainer}
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder || 'Enter text here...'}
          placeholderTextColor={themes.MEDIUMGREY}
          renderErrorMessage={renderErrorMessage}
          style={[{verticalAlign: 'top'}, multiline ? {height: 100} : {height: 40}]}
          value={value || ''}
        />
        {children}
      </View>
      <View style={overlayStyles.buttonContainer}>
        <Button
          onPress={onPress}
          title={buttonText || 'Save'}
          titleStyle={[overlayStyles.buttonText, overlayButtonText]}
          type={'clear'}
        />
        <Button
          onPress={closeModal}
          title={'Cancel'}
          titleStyle={overlayStyles.buttonText}
          type={'clear'}
        />
      </View>
    </Overlay>
  );
};

export default TextInputModal;
