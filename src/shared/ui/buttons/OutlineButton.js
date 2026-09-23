import React from 'react';

import {Button} from '@rn-vui/base';

import buttonStyles from './buttons.styles';

const OutlineButton = ({backgroundColor, containerStyle, disabled, icon, iconContainerStyle, loading, onPress, title}) => {
  return (
    <Button
      buttonStyle={[buttonStyles.standardButton,
        backgroundColor && {backgroundColor: backgroundColor},
      ]}
      containerStyle={[buttonStyles.standardButtonContainer, containerStyle]}
      disabled={disabled}
      icon={icon}
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
