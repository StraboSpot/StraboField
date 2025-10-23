import React from 'react';

import {Button} from '@rn-vui/base';

import commonStyles from '../../common.styles';

const ClearButton = ({disabled, icon, onPress, size, title, titleProps}) => {
  return (
    <Button
      buttonStyle={commonStyles.standardButton}
      disabled={disabled}
      icon={icon}
      onPress={onPress}
      size={size}
      title={title}
      titleProps={titleProps}
      titleStyle={commonStyles.standardButtonText}
      type={'clear'}
    />
  );
};
export default ClearButton;
