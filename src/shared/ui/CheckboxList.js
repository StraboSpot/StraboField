import React from 'react';

import {Icon, ListItem} from '@rn-vui/base';

import {MEDIUMGREY} from '../styles.constants';

const CheckboxList = ({handleCheckBoxPressed, isItemChecked, isReadOnly}) => {
  return (
    <>
      {isReadOnly && (
        <Icon
          color={MEDIUMGREY}
          containerStyle={{justifyContent: 'center', paddingRight: 5}}
          name={'lock-closed'}
          size={20}
          type={'ionicon'}
        />
      )}
      <ListItem.CheckBox
        checked={isItemChecked}
        disabled={isReadOnly}
        onPress={handleCheckBoxPressed}
      />
    </>
  );
};

export default CheckboxList;
