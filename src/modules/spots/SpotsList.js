import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {SpotsListItem, useSpots} from '.';
import SpotQuery from './SpotQuery';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const SpotsList = ({checkedItems, isCheckedList, onChecked, onPress}) => {
  // console.log('Rendering SpotsList...');

  /* Data Hooks */

  const {getVisibleSpots} = useSpots();

  /* Local State */

  const activeSpots = getVisibleSpots();

  const [scopeText, setScopeText] = useState('');
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);

  /* Derived Variables */

  const spotsNoSamples = spotsSorted.reduce((acc, s) => !s.properties?.isSample ? [...acc, s] : acc, []);
  const scopeSuffix = scopeText ? ` ${scopeText}` : '';
  const filterPrefix = scopeText ? 'Filtered Results: ' : '';

  /* View */

  return (
    <View style={{flex: 1}}>
      <SpotQuery
        activeSpots={activeSpots}
        setScopeText={setScopeText}
        setSpotsSorted={setSpotsSorted}
      />
      <View style={{flex: 1}}>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={`No Spots${scopeSuffix}`}/>}
          ListHeaderComponent={!isEmpty(spotsNoSamples) && (
            <Text
              style={[commonStyles.standardDescriptionText, {alignSelf: 'center', padding: 10, textAlign: 'center'}]}>
              {filterPrefix}{spotsNoSamples.length + (spotsNoSamples.length === 1 ? ' Spot' : ' Spots')}{scopeSuffix}
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
