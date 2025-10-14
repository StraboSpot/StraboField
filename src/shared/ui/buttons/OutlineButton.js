import React from 'react';

import {Button} from '@rn-vui/base';

import commonStyles from '../../common.styles';

const OutlineButton = ({disabled, icon, onPress, title}) => {
  return (
    <Button
      buttonStyle={commonStyles.standardButton}
      containerStyle={commonStyles.standardButtonContainer}
      disabled={disabled}
      icon={icon}
      iconContainerStyle={{paddingRight: 5}}
      onPress={onPress}
      title={title}
      titleStyle={commonStyles.standardButtonText}
      type={'outline'}
    />
  );
};
export default OutlineButton;
