import React from 'react';

import {Button} from '@rn-vui/base';

import commonStyles from '../../common.styles';
import {PRIMARY_ACCENT_COLOR, RED, SECONDARY_TEXT_COLOR} from '../../styles.constants';

const ActionButton = ({
                        disabled,
                        isLoading,
                        onPress,
                        title,
                      }) => {
  return (
    <Button
      buttonStyle={[commonStyles.standardButton, {backgroundColor: title === 'Delete' ? RED : PRIMARY_ACCENT_COLOR}]}
      containerStyle={commonStyles.standardButtonContainer}
      disabled={disabled}
      loading={isLoading}
      onPress={onPress}
      title={title || 'Save'}
      titleStyle={[commonStyles.standardButtonText, {color: SECONDARY_TEXT_COLOR}]}
      type={'solid'}
    />
  );
};

export default ActionButton;
