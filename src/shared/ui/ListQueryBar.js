import React, {useState} from 'react';
import {View} from 'react-native';

import {SearchBar} from '@rn-vui/base';

import ClearButton from './buttons/ClearButton';
import HorizontalLine from './HorizontalLine';
import {isEmpty} from '../helpers';
import {
  DARKGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_TEXT_COLOR,
  PRIMARY_TEXT_SIZE,
  SECONDARY_BACKGROUND_COLOR,
  WHITE,
} from '../styles.constants';
import PickerOverlay from './modals/PickerOverlay';

// Presentational search + filter + sort + reverse bar shared by the Spots and Tags lists. Owns only the
// picker open/close state; consumers supply the option data, the current values, and the callbacks.
const ListQueryBar = ({
                        filterOptions,
                        filterTitle = 'Filters',
                        filterValues,
                        onFilterClear,
                        onFilterToggle,
                        onReversePress,
                        onSearchChange,
                        onSortSelect,
                        searchValue,
                        sortOptions,
                        sortValue,
                      }) => {
  /* Local State */

  const [isFilterPickerVisible, setIsFilterPickerVisible] = useState(false);
  const [isSortPickerVisible, setIsSortPickerVisible] = useState(false);

  /* Derived Variables */

  // Filters are multi-select; any active filter highlights the icon and enables the clear button.
  const isFilterActive = !isEmpty(filterValues);
  const itemContainerStyle = {marginVertical: 4, paddingVertical: 6};
  const itemTextStyle = {color: PRIMARY_TEXT_COLOR, fontSize: PRIMARY_TEXT_SIZE, fontWeight: 'normal'};

  /* Event Handlers */

  const closeFilterPicker = () => setIsFilterPickerVisible(false);

  const closeSortPicker = () => setIsSortPickerVisible(false);

  const handleFilterClear = () => {
    onFilterClear();
    closeFilterPicker();
  };

  const handleSortSelect = (item) => {
    onSortSelect(item);
    closeSortPicker();
  };

  /* View */

  return (
    <>
      <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, marginVertical: -5}}>
        <SearchBar
          containerStyle={{
            backgroundColor: SECONDARY_BACKGROUND_COLOR,
            borderBottomColor: 'transparent',
            borderTopColor: 'transparent',
            flex: 1,
            padding: 0,
          }}
          inputContainerStyle={{backgroundColor: SECONDARY_BACKGROUND_COLOR}}
          inputStyle={{outlineStyle: 'none', fontSize: PRIMARY_TEXT_SIZE}}
          onChangeText={onSearchChange}
          placeholder={'Search'}
          placeholderTextColor={DARKGREY}
          platform={'default'}
          value={searchValue}
        />
        <View style={{alignItems: 'center', flexDirection: 'row'}}>
          <ClearButton
            icon={{
              color: isFilterActive ? WHITE : undefined,
              containerStyle: isFilterActive
                ? {backgroundColor: PRIMARY_ACCENT_COLOR, borderRadius: 10, marginHorizontal: 4, padding: 5}
                : {marginHorizontal: 4},
              name: 'filter-alt',
              type: 'material',
            }}
            onPress={() => setIsFilterPickerVisible(true)}
            size={'xs'}
          />
          <ClearButton
            icon={{containerStyle: {marginHorizontal: 4}, name: 'sort', type: 'material'}}
            onPress={() => setIsSortPickerVisible(true)}
            size={'xs'}
          />
          <ClearButton
            icon={{containerStyle: {marginHorizontal: 4}, name: 'swap-vert', type: 'material'}}
            onPress={onReversePress}
            size={'xs'}
          />
        </View>
      </View>
      <HorizontalLine style={{marginTop: 5}}/>

      {/* Modals */}
      <PickerOverlay
        checkedIcon={'check-box'}
        closePicker={closeFilterPicker}
        data={filterOptions}
        dividerText={filterTitle}
        isPickerVisible={isFilterPickerVisible}
        itemContainerStyle={itemContainerStyle}
        itemTextStyle={itemTextStyle}
        onClearPress={isFilterActive ? handleFilterClear : undefined}
        onSelect={onFilterToggle}
        selectedValues={filterValues}
        uncheckedIcon={'check-box-outline-blank'}
      />
      <PickerOverlay
        checkedIcon={'radio-button-checked'}
        closePicker={closeSortPicker}
        data={sortOptions}
        dividerText={'Sort'}
        isPickerVisible={isSortPickerVisible}
        itemContainerStyle={itemContainerStyle}
        itemTextStyle={itemTextStyle}
        onSelect={handleSortSelect}
        uncheckedIcon={'radio-button-unchecked'}
        value={sortValue}
      />
    </>
  );
};

export default ListQueryBar;
