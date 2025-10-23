import React from 'react';

import {Button} from '@rn-vui/base';

import commonStyles from '../../common.styles';
import {MEDIUMGREY, WARNING_COLOR} from '../../styles.constants';

const DeleteButton = ({disabled, onPress, title}) => {
  return (
    <Button
      buttonStyle={commonStyles.standardButton}
      disabled={disabled}
      icon={{
        color: disabled ? MEDIUMGREY : WARNING_COLOR,
        name: 'trash-outline',
        size: 20,
        type: 'ionicon',
      }}
      iconContainerStyle={{paddingRight: 5}}
      onPress={onPress}
      title={title}
      titleStyle={[commonStyles.standardButtonText, {color: disabled ? MEDIUMGREY : WARNING_COLOR}]}
      type={'clear'}
    />
  );
};
export default DeleteButton;
