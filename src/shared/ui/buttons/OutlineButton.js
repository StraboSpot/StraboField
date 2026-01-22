import React from 'react';

import {Button} from '@rn-vui/base';

import buttonStyles from './buttons.styles';

const OutlineButton = ({backgroundColor, disabled, icon, loading, onPress, title}) => {
  return (
    <Button
      buttonStyle={[buttonStyles.standardButton,
        backgroundColor && {backgroundColor: backgroundColor},
        {position: 'relative'},
      ]}
      containerStyle={buttonStyles.standardButtonContainer}
      disabled={disabled}
      icon={icon}
      iconContainerStyle={{position: 'absolute', left: 15}}
      loading={loading}
      onPress={onPress}
      title={title}
      titleStyle={[buttonStyles.standardButtonText, {width: '100%', textAlign: 'center'}]}
      type={'outline'}
    />
  );
};
export default OutlineButton;
