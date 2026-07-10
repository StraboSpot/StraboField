import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {SearchBar} from '@rn-vui/base';

import {TAG_SORT_ORDER} from './tagFilters.constants';
import {sortTagsByOrder} from './tagFilters.helpers';
import {isEmpty} from '../../../shared/helpers';
import {
  DARKGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_TEXT_SIZE,
  SECONDARY_BACKGROUND_COLOR,
  WHITE,
} from '../../../shared/styles.constants';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import HorizontalLine from '../../../shared/ui/HorizontalLine';
import PickerOverlay from '../../../shared/ui/modals/PickerOverlay';
import {getTagTitle} from '../tags.helpers';

const TagFilters = ({isGeologicUnits, selectedIndex, setSelectedIndex, setTagsSorted, tags}) => {
  /* Local State */

  const [isFilterPickerVisible, setIsFilterPickerVisible] = useState(false);
  const [isReverseSort, setIsReverseSort] = useState(false);
  const [isSortPickerVisible, setIsSortPickerVisible] = useState(false);
  const [searchState, setSearchState] = useState('');
  const [sortOrder, setSortOrder] = useState(isGeologicUnits ? TAG_SORT_ORDER.TEMPORAL : TAG_SORT_ORDER.ALPHABETICAL);
  const [tagsFiltered, setTagsFiltered] = useState(tags);

  /* Derived Variables */

  // Index 0 is the default (unfiltered) view, so only the map-extent filter is offered as an option.
  const filterOptions = ['Map Extent'];
  const isFilterActive = selectedIndex === 1;

  const sortOptions = isGeologicUnits ? Object.values(TAG_SORT_ORDER)
    : Object.values(TAG_SORT_ORDER).filter(v => v !== TAG_SORT_ORDER.TEMPORAL);

  /* Side Effects */

  useEffect(() => {
    const filtered = applySearch(searchState, tags);
    setTagsFiltered(filtered);
    setTagsSorted(sortTagsByOrder(filtered, sortOrder, isReverseSort));
  }, [tags]);

  /* Logic Helpers */

  const applySearch = (search, tagsToSearch) => {
    if (isEmpty(search)) return tagsToSearch;
    return tagsToSearch.filter(t => getTagTitle(t).toLowerCase().includes(search.toLowerCase()));
  };

  const clearFilter = () => {
    setSelectedIndex(0);
    closeFilterPicker();
  };

  const closeFilterPicker = () => setIsFilterPickerVisible(false);

  const closeSortPicker = () => setIsSortPickerVisible(false);

  const toggleReverseSort = () => {
    const newReverse = !isReverseSort;
    setIsReverseSort(newReverse);
    setTagsSorted(sortTagsByOrder(tagsFiltered, sortOrder, newReverse));
  };

  const updateFilter = () => {
    setSelectedIndex(1);
    closeFilterPicker();
  };

  const updateSearch = (search) => {
    setSearchState(search);
    const filtered = applySearch(search, tags);
    setTagsFiltered(filtered);
    setTagsSorted(sortTagsByOrder(filtered, sortOrder, isReverseSort));
  };

  const updateSort = (sort) => {
    setSortOrder(sort);
    setTagsSorted(sortTagsByOrder(tagsFiltered, sort, isReverseSort));
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
          onChangeText={updateSearch}
          placeholder={'Search Tag Names'}
          placeholderTextColor={DARKGREY}
          platform={'default'}
          value={searchState}
        />
        <View style={{marginHorizontal: -10}}>
          <ClearButton
            icon={{
              color: isFilterActive ? WHITE : undefined,
              containerStyle: isFilterActive
                ? {backgroundColor: PRIMARY_ACCENT_COLOR, borderRadius: 10, padding: 5}
                : undefined,
              name: 'filter-alt',
              type: 'material',
            }}
            onPress={() => setIsFilterPickerVisible(true)}
          />
        </View>
        <View style={{marginHorizontal: -10}}>
          <ClearButton icon={{name: 'sort', type: 'material'}} onPress={() => setIsSortPickerVisible(true)}/>
        </View>
        <View style={{marginHorizontal: -10}}>
          <ClearButton icon={{name: 'swap-vert', type: 'material'}} onPress={toggleReverseSort}/>
        </View>
      </View>
      <HorizontalLine style={{marginTop: 5}}/>

      {/* Modals */}
      <PickerOverlay
        closePicker={closeFilterPicker}
        data={filterOptions}
        dividerText={'Filters'}
        isPickerVisible={isFilterPickerVisible}
        onClearPress={isFilterActive ? clearFilter : undefined}
        onSelect={() => updateFilter()}
        value={isFilterActive ? filterOptions[0] : null}
      />
      <PickerOverlay
        closePicker={closeSortPicker}
        data={sortOptions}
        dividerText={'Sort'}
        isPickerVisible={isSortPickerVisible}
        onSelect={item => updateSort(item)}
        value={sortOrder}
      />
    </>
  );
};

export default TagFilters;
