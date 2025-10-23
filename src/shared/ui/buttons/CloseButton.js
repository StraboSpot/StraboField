import React from 'react';

import {Button} from '@rn-vui/base';

import {BLACK, MEDIUM_TEXT_SIZE} from '../../styles.constants';

const CloseButton = ({onPress, title}) => {
  if (title) {
    return (
      <Button
        onPress={onPress}
        title={title}
        titleStyle={{color: BLACK, fontSize: MEDIUM_TEXT_SIZE}}
        type={'clear'}
      />
    );
  }
  else {
    return (
      <Button
        icon={{
          containerStyle: {margin: -10},
          color: BLACK,
          name: 'close-outline',
          size: 25,
          type: 'ionicon',
          style: {padding: 5},
        }}
        onPress={onPress}
        type={'clear'}
      />
    );
  }
};
export default CloseButton;
