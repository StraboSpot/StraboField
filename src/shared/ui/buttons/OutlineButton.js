import React from 'react';

import {Button} from '@rn-vui/base';

import commonStyles from '../../common.styles';

const OutlineButton = ({icon, onPress, title}) => {
  return (
    <Button
      buttonStyle={commonStyles.standardButton}
      containerStyle={commonStyles.standardButtonContainer}
      icon={icon}
      onPress={onPress}
      title={title}
      titleStyle={commonStyles.standardButtonText}
      type={'outline'}
    />
  );
};
export default OutlineButton;
