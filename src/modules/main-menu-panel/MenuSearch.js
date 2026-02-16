import React from 'react';

import {SearchBar} from '@rn-vui/base';

import {
  DARKGREY,
  PRIMARY_BACKGROUND_COLOR,
  PRIMARY_TEXT_SIZE,
  SECONDARY_BACKGROUND_COLOR,
} from '../../shared/styles.constants';

const MenuSearch = ({searchState, setSearchState}) => {
  /* Event Handlers */

  const handleSearch = searchText => setSearchState(searchText.toLowerCase().trim());

  /* View */

  return (
    <SearchBar
      autoCorrect={false}
      cancelIcon
      clearIcon
      containerStyle={{
        backgroundColor: SECONDARY_BACKGROUND_COLOR,
        borderBottomColor: 'transparent',
        borderTopColor: 'transparent',
        padding: 0,
      }}
      inputContainerStyle={{backgroundColor: PRIMARY_BACKGROUND_COLOR}}
      inputStyle={{outlineStyle: 'none', fontSize: PRIMARY_TEXT_SIZE}}
      onChangeText={handleSearch}
      placeholder={'Search Menu...'}
      placeholderTextColor={DARKGREY}
      platform={'default'}
      value={searchState}
    />
  );
};

export default MenuSearch;
