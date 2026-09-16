import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import SpotQuery from './SpotQuery';
import SpotsListItem from './SpotsListItem';
import useSpots from './useSpots';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const SpotsList = ({checkedItems, ignoreReadOnly, isCheckedList, isSamplesList, onChecked, onPress}) => {
  // console.log('Rendering SpotsList...');

  /* Data Hooks */

  const {getSampleSpots, getVisibleSpots} = useSpots();

  /* Local State */

  // Samples are listed apart from Spots, so each list asks for its own kind
  const activeSpots = isSamplesList ? getSampleSpots() : getVisibleSpots();

  const [scopeText, setScopeText] = useState('');
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);

  /* Derived Variables */

  const itemLabel = isSamplesList ? 'Sample' : 'Spot';
  const countText = `${spotsSorted.length} ${spotsSorted.length === 1 ? itemLabel : itemLabel + 's'}`;
  const scopeSuffix = scopeText ? ` ${scopeText}` : '';
  const filterPrefix = scopeText ? 'Filtered Results: ' : '';

  /* View */

  return (
    <View style={{flex: 1}}>
      <SpotQuery
        activeSpots={activeSpots}
        isSamplesSearch={isSamplesList}
        setScopeText={setScopeText}
        setSpotsSorted={setSpotsSorted}
      />
      <View style={{flex: 1}}>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={`No ${itemLabel}s${scopeSuffix}`}/>}
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
              doShowTags={true}
              ignoreReadOnly={ignoreReadOnly}
              isCheckedList={isCheckedList}
              isItemChecked={checkedItems && checkedItems.find(i => i === item?.properties?.id)}
              isSample={isSamplesList}
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
