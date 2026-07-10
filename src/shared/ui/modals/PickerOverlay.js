import React from 'react';
import {FlatList, View} from 'react-native';

import {Button, CheckBox} from '@rn-vui/base';

import ModalWrapper from './ModalWrapper';
import {
  PRIMARY_ACCENT_COLOR,
  PRIMARY_TEXT_COLOR,
  PRIMARY_TEXT_SIZE,
  SECONDARY_BACKGROUND_COLOR,
} from '../../styles.constants';

const PickerOverlay = ({clearButtonTitle, closePicker, data, dividerText, isPickerVisible, onClearPress, onSelect, value}) => {
  /* Event Handlers */

  const handleSelect = item => onSelect(item);

  /* View */

  return (
    <ModalWrapper
      closeModal={closePicker}
      headerTitle={dividerText}
      isVisible={isPickerVisible}
      overlayStyleOverride={{height: 'auto'}}
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
      {onClearPress && (
        <View style={{padding: 10, paddingTop: 20}}>
          <Button
            buttonStyle={{borderColor: PRIMARY_ACCENT_COLOR, borderRadius: 10}}
            icon={{color: PRIMARY_ACCENT_COLOR, name: 'filter-alt-off', type: 'material'}}
            onPress={onClearPress}
            title={clearButtonTitle || 'Clear Filters'}
            titleStyle={{color: PRIMARY_ACCENT_COLOR}}
            type={'outline'}
          />
        </View>
      )}
    </ModalWrapper>
  );
};

export default PickerOverlay;
