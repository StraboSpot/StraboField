import React from 'react';

import {Button} from '@rn-vui/base';

import {PRIMARY_ACCENT_COLOR} from '../../styles.constants';

const SaveButton = ({
                      isLoading,
                      onPress,
                      title,
                    }) => {
  return (
    <Button
      buttonStyle={{borderRadius: 10, marginTop: 10, marginBottom: 10, backgroundColor: PRIMARY_ACCENT_COLOR}}
      containerStyle={{alignItems: 'center', padding: 10}}
      loading={isLoading}
      onPress={onPress}
      title={title}
      type={'solid'}
    />
  );
};

export default SaveButton;
