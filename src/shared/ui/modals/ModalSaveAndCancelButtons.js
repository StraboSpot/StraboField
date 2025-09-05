import React from 'react';
import {View} from 'react-native';

import {Button} from '@rn-vui/base';

import {overlayStyles} from '../../../modules/home/overlays';
import ActionButton from '../buttons/ActionButton';

const ModalSaveAndCancelButtons = ({disabled, onCancelPress, onSavePress, actionTitle}) => {
  return (
    <View style={overlayStyles.buttonContainer}>
      <Button
        onPress={onCancelPress}
        title={'Cancel'}
        titleStyle={overlayStyles.clearButtonText}
        type={'outline'}
      />
      {/*<Button*/}
      {/*  buttonStyle={overlayStyles.buttonStyle}*/}
      {/*  disabled={disabled}*/}
      {/*  onPress={onSavePress}*/}
      {/*  title={titleText || 'Save'}*/}
      {/*/>*/}
      <ActionButton
        disabled={disabled}
        isLoading={false}
        onPress={onSavePress}
        title={actionTitle}
      />
    </View>
  );
};

export default ModalSaveAndCancelButtons;
