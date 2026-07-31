import React from 'react';
import {FlatList, View} from 'react-native';

import {Button, CheckBox} from '@rn-vui/base';

import ModalWrapper from './ModalWrapper';
import {PRIMARY_ACCENT_COLOR, SECONDARY_BACKGROUND_COLOR} from '../../styles.constants';
import SectionDivider from '../SectionDivider';

// checkedIcon/uncheckedIcon and the item*Style props default to a bare checkmark list; callers such as
// ListQueryBar override them to get outlined checkboxes / radio buttons with custom text and spacing.
const PickerOverlay = ({
                         checkedIcon = 'check',
                         clearButtonTitle,
                         closePicker,
                         data,
                         dividerText,
                         isPickerVisible,
                         itemContainerStyle,
                         itemTextStyle,
                         onClearPress,
                         onSelect,
                         selectedValues,
                         uncheckedIcon = '',
                         value,
                       }) => {
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
          if (item?.header) return <SectionDivider dividerText={item.header}/>;
          return (
            <CheckBox
              checked={selectedValues ? selectedValues.includes(item) : item === value}
              checkedIcon={checkedIcon}
              containerStyle={[{backgroundColor: SECONDARY_BACKGROUND_COLOR, borderWidth: 0}, itemContainerStyle]}
              iconType={'material'}
              onPress={() => handleSelect(item)}
              textStyle={itemTextStyle}
              title={item}
              uncheckedIcon={uncheckedIcon}
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
