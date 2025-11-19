import React from 'react';

import {Button} from '@rn-vui/base';

import buttonStyles from './buttons.styles';
import {PRIMARY_ACCENT_COLOR, SECONDARY_TEXT_COLOR, WARNING_COLOR} from '../../styles.constants';

const ActionButton = ({
                        disabled,
                        isLoading,
                        onPress,
                        title,
                      }) => {
  return (
    <Button
      buttonStyle={[buttonStyles.standardButton, {
        backgroundColor: title.includes('Delete') ? WARNING_COLOR : PRIMARY_ACCENT_COLOR,
      }]}
      containerStyle={buttonStyles.standardButtonContainer}
      disabled={disabled}
      loading={isLoading}
      onPress={onPress}
      title={title || 'Save'}
      titleStyle={[buttonStyles.standardButtonText, {color: SECONDARY_TEXT_COLOR}]}
      type={'solid'}
    />
  );
};

export default ActionButton;
