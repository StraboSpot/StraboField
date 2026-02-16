import React from 'react';
import {FlatList} from 'react-native';

import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {PAGE_KEYS} from '../page/page.constants';
import {TagsListItem, useTags} from '../tags';

const TagsAtSpotList = ({openMainMenuPanel, page}) => {
  /* Data Hooks */

  const {getGeologicUnitTagsAtSpot, getNonGeologicUnitTagsAtSpot} = useTags();

  /* Derived Variables */

  const data = page.key === PAGE_KEYS.GEOLOGIC_UNITS ? getGeologicUnitTagsAtSpot() : getNonGeologicUnitTagsAtSpot();
  const listEmptyText = page.key === PAGE_KEYS.GEOLOGIC_UNITS ? 'No Geologic Units' : 'No Tags';

  /* Render Functions */

  const renderTag = (tag) => {
    return <TagsListItem isChevronVisible openMainMenuPanel={openMainMenuPanel} tag={tag}/>;
  };

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={<ListEmptyText text={listEmptyText}/>}
      data={data}
      keyExtractor={item => item.id.toString()}
      renderItem={({item}) => renderTag(item)}
    />
  );
};

export default TagsAtSpotList;
