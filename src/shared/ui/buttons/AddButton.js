import React from 'react';

import OutlineButton from './OutlineButton';
import commonStyles from '../../common.styles';

const AddButton = ({onPress, title}) => {
  return (
    <OutlineButton
      icon={{
        name: 'add',
        type: 'ionicon',
        size: 20,
        color: commonStyles.iconColor.color,
      }}
      onPress={onPress}
      title={title}
    />
  );
};

export default AddButton;
