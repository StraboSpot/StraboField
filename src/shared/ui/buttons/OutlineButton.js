import React from 'react';

import {Button} from '@rn-vui/base';

import commonStyles from '../../common.styles';

const OutlineButton = ({backgroundColor, disabled, icon, loading, onPress, title}) => {
  return (
    <Button
      buttonStyle={[commonStyles.standardButton, backgroundColor && {backgroundColor: backgroundColor}]}
      containerStyle={commonStyles.standardButtonContainer}
      disabled={disabled}
      icon={icon}
      iconContainerStyle={{paddingRight: 5}}
      loading={loading}
      onPress={onPress}
      title={title}
      titleStyle={commonStyles.standardButtonText}
      type={'outline'}
    />
  );
};
export default OutlineButton;
