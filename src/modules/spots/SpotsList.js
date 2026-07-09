import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {SpotsListItem, useSpots} from '.';
import SpotFilters from './SpotFilters';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const SpotsList = ({checkedItems, isCheckedList, onChecked, onPress, updateSpotsInMapExtent}) => {
  // console.log('Rendering SpotsList...');

  /* Data Hooks */

  const {getVisibleSpots} = useSpots();

  /* Local State */

  const activeSpots = getVisibleSpots();

  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Active Datasets');

  /* Derived Variables */

  const spotsNoSamples = spotsSorted.reduce((acc, s) => !s.properties?.isSample ? [...acc, s] : acc, []);

  /* View */

  return (
    <View style={{flex: 1}}>
      <SpotFilters
        activeSpots={activeSpots}
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
          data={spotsNoSamples}
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
