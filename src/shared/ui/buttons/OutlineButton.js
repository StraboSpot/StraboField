import React from 'react';

import {Button} from '@rn-vui/base';

import buttonStyles from './buttons.styles';

const OutlineButton = ({backgroundColor, disabled, icon, loading, onPress, title}) => {
  return (
    <Button
      buttonStyle={[buttonStyles.standardButton, backgroundColor && {backgroundColor: backgroundColor}]}
      containerStyle={buttonStyles.standardButtonContainer}
      disabled={disabled}
      icon={icon}
      iconContainerStyle={{paddingRight: 5}}
      loading={loading}
      onPress={onPress}
      title={title}
      titleStyle={buttonStyles.standardButtonText}
      type={'outline'}
    />
  );
};
export default OutlineButton;
