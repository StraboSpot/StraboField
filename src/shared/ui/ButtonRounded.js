import React from 'react';

import {Button} from '@rn-vui/base';

import uiStyles from '../ui/ui.styles';

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
      icon={icon}
      title={title}
      containerStyle={[uiStyles.saveAndDeleteButtonContainer, containerStyle]}
      buttonStyle={[uiStyles.saveAndDeleteButtonStyles, buttonStyle]}
      titleStyle={titleStyle}
      onPress={onPress}
      disabled={disabled}
    />
  );
};

export default ButtonRounded;
