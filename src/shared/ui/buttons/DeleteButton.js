import React from 'react';

import {Button} from '@rn-vui/base';

import buttonStyles from './buttons.styles';
import {MEDIUMGREY, WARNING_COLOR} from '../../styles.constants';

const DeleteButton = ({disabled, onPress, title}) => {
  return (
    <Button
      buttonStyle={buttonStyles.standardButton}
      disabled={disabled}
      icon={{
        color: disabled ? MEDIUMGREY : WARNING_COLOR,
        name: 'trash-outline',
        size: 25,
        type: 'ionicon',
      }}
      iconContainerStyle={{paddingRight: 5}}
      onPress={onPress}
      title={title}
      titleStyle={[buttonStyles.standardButtonText, {color: disabled ? MEDIUMGREY : WARNING_COLOR}]}
      type={'clear'}
    />
  );
};
export default DeleteButton;
