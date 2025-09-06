import React from 'react';
import {View} from 'react-native';

import {Input} from '@rn-vui/base';

import * as themes from '../styles.constants';
import ModalWrapper from './modals/ModalWrapper';
import overlayStyles from './modals/overlay.styles';

const TextInputModal = ({
                          autoCapitalize,
                          buttonText,
                          children,
                          dialogTitle,
                          errorMessage,
                          keyboardType,
                          multiline,
                          onActionPressed,
                          onChangeText,
                          onCancelPress,
                          onDeletePress,
                          onSubmitEditing,
                          placeholder,
                          renderErrorMessage,
                          showDeleteButton,
                          textAboveInput,
                          value,
                          visible,
                        }) => {
  return (
    <ModalWrapper
      actionTitle={buttonText || 'Save'}
      headerTitle={dialogTitle}
      isVisible={visible}
      onActionPressed={onActionPressed}
      onCancelPress={onCancelPress}
      onDeletePress={onDeletePress}
      shouldShowButtons
      showDeleteButton={showDeleteButton}
    >
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
          placeholder={placeholder || ' Enter text here...'}
          placeholderTextColor={themes.MEDIUMGREY}
          renderErrorMessage={renderErrorMessage}
          style={[{verticalAlign: 'top'}, multiline ? {height: 100} : {height: 40}]}
          value={value || ''}
        />
        {children}
      </View>
    </ModalWrapper>
  );
};

export default TextInputModal;

