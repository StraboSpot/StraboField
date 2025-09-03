import React from 'react';
import {View} from 'react-native';

import {Button} from '@rn-vui/base';

import {overlayStyles} from '../../../modules/home/overlays';

const OverlaySaveAndCancelButtons = ({disabled, onCancelPress, onSavePress, titleText}) => {
  return (
    <View style={overlayStyles.buttonContainer}>
      <Button
        onPress={onCancelPress}
        title='Cancel'
        titleStyle={overlayStyles.clearButtonText}
        type='clear'
      />
      <Button
        // buttonStyle={{
        //   paddingVertical: 12,
        //   paddingHorizontal: 24,
        //   borderRadius: 8,
        //   backgroundColor: '#007AFF',
        // }}
        buttonStyle={overlayStyles.buttonStyle}
        disabled={disabled}
        onPress={onSavePress}
        title={titleText || 'Save'}
        // titleStyle={overlayStyles.clearButtonText}
      />
    </View>
  );
};

export default OverlaySaveAndCancelButtons;
