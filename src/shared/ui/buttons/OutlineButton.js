import React from 'react';

import {Button} from '@rn-vui/base';

import buttonStyles from './buttons.styles';
import {MEDIUMGREY} from '../../styles.constants';

const OutlineButton = ({
                         backgroundColor,
                         containerStyle,
                         disabled,
                         icon,
                         iconContainerStyle,
                         loading,
                         onPress,
                         title,
                       }) => {
  return (
    <Button
      buttonStyle={[buttonStyles.standardButton,
        backgroundColor && {backgroundColor: backgroundColor},
      ]}
      containerStyle={[buttonStyles.standardButtonContainer, containerStyle]}
      disabled={disabled}
      // The button grays its title when disabled but leaves an icon its own color
      icon={icon && disabled ? {...icon, color: MEDIUMGREY} : icon}
      iconContainerStyle={[{paddingRight: 5}, iconContainerStyle]}
      loading={loading}
      onPress={onPress}
      title={title}
      titleStyle={[buttonStyles.standardButtonText, {textAlign: 'center'}]}
      type={'outline'}
    />
  );
};
export default OutlineButton;
