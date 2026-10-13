import React from 'react';

import {Button} from '@rn-vui/base';

import buttonStyles from './buttons.styles';

const ClearButton = ({disabled, icon, isLoading, onPress, size, title, titleProps}) => {
  return (
    <Button
      buttonStyle={buttonStyles.standardButton}
      disabled={disabled}
      icon={icon}
      loading={isLoading}
      onPress={onPress}
      size={size}
      title={title}
      titleProps={titleProps}
      titleStyle={buttonStyles.standardButtonText}
      type={'clear'}
    />
  );
};
export default ClearButton;
