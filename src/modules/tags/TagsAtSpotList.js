import React from 'react';
import {FlatList} from 'react-native';

import {useDispatch} from 'react-redux';

import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {TagsListItem, useTags} from '../tags';

const TagsAtSpotList = ({openMainMenuPanel, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
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
      ListEmptyComponent={
        <ListEmptyText onPress={() => dispatch(setNotebookPageVisible(page.key))} text={listEmptyText}/>
      }
      data={data}
      keyExtractor={item => item.id.toString()}
      renderItem={({item}) => renderTag(item)}
    />
  );
};

export default TagsAtSpotList;
