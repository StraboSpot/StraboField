import React from 'react';

import {Button} from '@rn-vui/base';

import commonStyles from '../../common.styles';
import {PRIMARY_ACCENT_COLOR, SECONDARY_TEXT_COLOR, WARNING_COLOR} from '../../styles.constants';

const ActionButton = ({
                        disabled,
                        isLoading,
                        onPress,
                        title,
                      }) => {
  return (
    <Button
      buttonStyle={[commonStyles.standardButton, {backgroundColor: title === 'Delete' ? WARNING_COLOR : PRIMARY_ACCENT_COLOR}]}
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
