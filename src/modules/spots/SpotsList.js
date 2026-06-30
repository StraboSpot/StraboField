import React, {useEffect, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {SpotsListItem, useSpots} from '.';
import SpotFilters from './SpotFilters';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const SpotsList = ({checkedItems, isCheckedList, onChecked, onPress, updateSpotsInMapExtent}) => {
  // console.log('Rendering SpotsList...');

  /* Data Hooks */

  const sortedView = useSelector(state => state.mainMenu.sortedView);

  const {getVisibleSpots} = useSpots();

  /* Local State */

  const [isReverseSort, setIsReverseSort] = useState(false);

  const activeSpots = getVisibleSpots();

  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Active Datasets');

  /* Derived Variables */

  const spotsNoSamples = spotsSorted.reduce((acc, s) => !s.properties?.isSample ? [...acc, s] : acc, []);

  /* Side Effects */

  useEffect(() => {
    setSpotsSorted(getVisibleSpots());
  }, [sortedView]);

  /* View */

  return (
    <View style={{flex: 1}}>
      <SpotFilters
        activeSpots={spotsNoSamples}
        setIsReverseSort={setIsReverseSort}
        setSpotsSorted={setSpotsSorted}
        setTextNoSpots={setTextNoSpots}
        updateSpotsInMapExtent={updateSpotsInMapExtent}
      />
      <View style={{flex: 1}}>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={textNoSpots + ' Found'}/>}
          ListHeaderComponent={!isEmpty(spotsNoSamples) && (
            <Text
              style={[commonStyles.standardDescriptionText, {alignSelf: 'center', padding: 10, textAlign: 'center'}]}>
              Found {spotsNoSamples.length + (spotsNoSamples.length === 1 ? ' Spot' : ' Spots')} in Active Datasets
            </Text>
          )}
          data={isReverseSort ? [...spotsNoSamples].reverse() : spotsNoSamples}
          keyExtractor={spot => spot.properties.id.toString()}
          renderItem={({item}) => (
            <SpotsListItem
              doShowTags={true}
              isCheckedList={isCheckedList}
              isItemChecked={checkedItems && checkedItems.find(i => i === item?.properties?.id)}
              onChecked={onChecked}
              onPress={onPress}
              spot={item}
            />
          )}
        />
      </View>
    </View>
  );
};

export default SpotsList;
