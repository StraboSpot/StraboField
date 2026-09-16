import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import SpotQuery from './SpotQuery';
import SpotsListItem from './SpotsListItem';
import useSpots from './useSpots';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const SpotsList = ({canPickReadOnly, checkedItems, isCheckedList, onChecked, onPress}) => {
  // console.log('Rendering SpotsList...');

  /* Data Hooks */

  const {getVisibleSpots} = useSpots();

  /* Local State */

  const activeSpots = getVisibleSpots();

  const [scopeText, setScopeText] = useState('');
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);

  /* Derived Variables */

  const countText = `${spotsSorted.length} ${spotsSorted.length === 1 ? 'Spot' : 'Spots'}`;
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
          ListHeaderComponent={!isEmpty(spotsSorted) && (
            <Text
              style={[commonStyles.standardDescriptionText, {alignSelf: 'center', padding: 10, textAlign: 'center'}]}>
              {filterPrefix}{countText}{scopeSuffix}
            </Text>
          )}
          data={spotsSorted}
          keyExtractor={spot => spot.properties.id.toString()}
          renderItem={({item}) => (
            <SpotsListItem
              canPickReadOnly={canPickReadOnly}
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
