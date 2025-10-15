import React from 'react';

import {Button, Icon} from '@rn-vui/base';

import commonStyles from '../../common.styles';
import {WARNING_COLOR} from '../../styles.constants';

const DeleteButton = ({onPress, title}) => {
  return (
    <Button
      buttonStyle={commonStyles.standardButton}
      containerStyle={commonStyles.standardButtonContainer}
      icon={
        <Icon
          color={'red'}
          name={'trash-outline'}
          size={25}
          type={'ionicon'}
        />
      }
      iconContainerStyle={{paddingRight: 5}}
      onPress={onPress}
      title={title}
      titleStyle={[commonStyles.standardButtonText, {color: WARNING_COLOR}]}
      type={'clear'}
    />
  );
};
export default DeleteButton;
