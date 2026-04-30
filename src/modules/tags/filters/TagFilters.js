import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {SearchBar} from '@rn-vui/base';

import {TAG_SORT_ORDER} from './tagFilters.constants';
import {sortTagsByOrder} from './tagFilters.helpers';
import {isEmpty} from '../../../shared/helpers';
import {DARKGREY, PRIMARY_TEXT_SIZE, SECONDARY_BACKGROUND_COLOR} from '../../../shared/styles.constants';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import PickerOverlay from '../../../shared/ui/modals/PickerOverlay';
import {getTagTitle} from '../tags.helpers';

const TagFilters = ({isGeologicUnits, setTagsSorted, tags}) => {
  /* Local State */

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isReverseSort, setIsReverseSort] = useState(false);
  const [searchState, setSearchState] = useState('');
  const [sortOrder, setSortOrder] = useState(isGeologicUnits ? TAG_SORT_ORDER.TEMPORAL : TAG_SORT_ORDER.ALPHABETICAL);
  const [tagsFiltered, setTagsFiltered] = useState(tags);

  /* Derived Variables */

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

  const closePicker = () => setIsPickerVisible(false);

  const toggleReverseSort = () => {
    const newReverse = !isReverseSort;
    setIsReverseSort(newReverse);
    setTagsSorted(sortTagsByOrder(tagsFiltered, sortOrder, newReverse));
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
    closePicker();
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
          <ClearButton icon={{name: 'sort', type: 'material'}} onPress={() => setIsPickerVisible(true)}/>
        </View>
        <View style={{marginHorizontal: -10}}>
          <ClearButton icon={{name: 'swap-vert', type: 'material'}} onPress={toggleReverseSort}/>
        </View>
      </View>
      <PickerOverlay
        closePicker={closePicker}
        data={sortOptions}
        dividerText={'Sort'}
        isPickerVisible={isPickerVisible}
        onSelect={item => updateSort(item)}
        value={sortOrder}
      />
    </>
  );
};

export default TagFilters;
