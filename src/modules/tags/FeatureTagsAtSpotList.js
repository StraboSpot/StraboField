import React from 'react';
import {FlatList} from 'react-native';

import {useSelector} from 'react-redux';

import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {PAGE_KEYS} from '../page/page.constants';
import {useSpots} from '../spots';
import {TagsListItem, useTags} from '../tags';

const FeatureTagsAtSpotList = ({openMainMenuPanel, page}) => {
  /* Data Hooks / State */

  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getAllFeaturesFromSpot} = useSpots();
  const {getGeologicUnitFeatureTagsAtSpot, getNonGeologicUnitFeatureTagsAtSpot} = useTags();

  /* Derived Variables */

  const listEmptyText = page.key === PAGE_KEYS.GEOLOGIC_UNITS ? 'No Geologic Units' : 'No Tags';

  /* Logic Helpers */

  const getFeatureTagsAtSpot = () => {
    let featuresAtSpot = getAllFeaturesFromSpot(selectedSpot);
    return page.key === PAGE_KEYS.GEOLOGIC_UNITS ? getGeologicUnitFeatureTagsAtSpot(featuresAtSpot)
      : getNonGeologicUnitFeatureTagsAtSpot(featuresAtSpot);
  };

  /* Render Functions */

  const renderTag = (tag) => {
    return <TagsListItem isChevronVisible openMainMenuPanel={openMainMenuPanel} tag={tag}/>;
  };

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={<ListEmptyText text={listEmptyText}/>}
      data={getFeatureTagsAtSpot()}
      keyExtractor={item => item.id.toString()}
      renderItem={({item}) => renderTag(item)}
    />
  );
};

export default FeatureTagsAtSpotList;
