import React from 'react';
import {View} from 'react-native';

import {overlayStyles} from '../../../modules/home/overlays';
import ActionButton from '../buttons/ActionButton';
import ClearButton from '../buttons/ClearButton';
import OutlineButton from '../buttons/OutlineButton';

const ModalSaveAndCancelButtons = ({
                                     cancelTitle,
                                     disabled,
                                     onCancelPress,
                                     onDeletePress,
                                     onActionPressed,
                                     actionTitle,
                                     isLoading,
                                     showActionButton = true,
                                     showCancelButton = true,
                                     showDeleteButton = false,
                                   }) => {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
    }}>
      <View style={overlayStyles.buttonContainer}>
        {showDeleteButton && (
          <ClearButton
            icon={{
              color: 'red',
              name: 'trash-outline',
              size: 25,
              type: 'ionicon',
            }}
            onPress={onDeletePress}
          />
        )}
      </View>
      <View style={overlayStyles.buttonContainer}>
        {showCancelButton && (
          <OutlineButton
            onPress={onCancelPress}
            title={cancelTitle || 'Cancel'}
          />
        )}
        {showActionButton && (
          <ActionButton
            disabled={disabled}
            isLoading={isLoading}
            onPress={onActionPressed}
            title={actionTitle || 'Save'}
          />
        )}
      </View>
    </View>
  );
};

export default ModalSaveAndCancelButtons;
