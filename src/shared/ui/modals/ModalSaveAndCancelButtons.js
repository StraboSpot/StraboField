import React from 'react';
import {View} from 'react-native';

import {overlayStyles} from '../../../modules/home/overlays';
import ActionButton from '../buttons/ActionButton';
import DeleteButton from '../buttons/DeleteButton';
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
  // When the action button is the only button shown, stretch it to fill the bar, but cap its
  // width on wide modals so it stays centered rather than spanning the whole width.
  if (showActionButton && !showCancelButton && !showDeleteButton) {
    return (
      <View style={{alignItems: 'center'}}>
        <View style={{maxWidth: 400, width: '100%'}}>
          <ActionButton
            disabled={disabled}
            isLoading={isLoading}
            onPress={onActionPressed}
            title={actionTitle || 'Save'}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
    }}>
      <View style={overlayStyles.buttonContainer}>
        {showDeleteButton && <DeleteButton onPress={onDeletePress}/>}
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
