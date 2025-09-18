import React from 'react';

import {Button} from '@rn-vui/base';

import uiStyles from '../ui.styles';

const ButtonRounded = ({
                         buttonStyle,
                         containerStyle,
                         disabled,
                         icon,
                         onPress,
                         title,
                         titleStyle,
                       }) => {
  return (
    <Button
      buttonStyle={[uiStyles.saveAndDeleteButtonStyles, buttonStyle]}
      containerStyle={[uiStyles.saveAndDeleteButtonContainer, containerStyle]}
      disabled={disabled}
      icon={icon}
      onPress={onPress}
      title={title}
      titleStyle={titleStyle}
    />
  );
};

export default ButtonRounded;
