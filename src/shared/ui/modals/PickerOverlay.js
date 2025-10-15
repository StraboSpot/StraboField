import React from 'react';
import {FlatList} from 'react-native';

import {CheckBox} from '@rn-vui/base';

import ModalWrapper from './ModalWrapper';
import {PRIMARY_TEXT_COLOR, PRIMARY_TEXT_SIZE, SECONDARY_BACKGROUND_COLOR} from '../../styles.constants';

const PickerOverlay = ({closePicker, data, dividerText, isPickerVisible, onSelect, value}) => {

  const handleSelect = (item) => {
    onSelect(item);
  };

  return (
    <ModalWrapper
      closeModal={closePicker}
      headerTitle={dividerText}
      isVisible={isPickerVisible}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <FlatList
        data={data}
        renderItem={({item}) => {
          return (
            <CheckBox
              checked={item === value}
              checkedIcon={'check'}
              containerStyle={{backgroundColor: SECONDARY_BACKGROUND_COLOR, borderWidth: 0}}
              iconType={'material'}
              onPress={() => handleSelect(item)}
              title={item}
              titleStyle={{color: PRIMARY_TEXT_COLOR, size: PRIMARY_TEXT_SIZE}}
              uncheckedIcon={''}
            />
          );
        }}
      />
    </ModalWrapper>
  );
};

export default PickerOverlay;
