import React from 'react';

import {Button} from '@rn-vui/base';

import commonStyles from '../../shared/common.styles';

const AddButton = ({
                     onPress,
                     title,
                     type,
                   }) => {
  return (
    <Button
      buttonStyle={commonStyles.standardButton}
      containerStyle={commonStyles.buttonPadding}
      icon={{
        name: 'add',
        type: 'ionicon',
        size: 25,
        color: commonStyles.iconColor.color,
      }}
      onPress={onPress}
      title={title}
      titleStyle={commonStyles.standardButtonText}
      type={type}
    />
  );
};

export default AddButton;
