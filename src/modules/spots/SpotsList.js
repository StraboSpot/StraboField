import React, {useState} from 'react';
import {FlatList, View} from 'react-native';

import {SpotsListItem, useSpots} from '.';
import SpotFilters from './SpotFilters';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';

const SpotsList = ({checkedItems, isCheckedList, onChecked, onPress, updateSpotsInMapExtent}) => {
  // console.log('Rendering SpotsList...');

  const {getVisibleSpots} = useSpots();

  const activeSpots = getVisibleSpots();

  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [isReverseSort, setIsReverseSort] = useState(false);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Visible Datasets');

  const renderNoSpotsText = () => <ListEmptyText text={textNoSpots}/>;

  const renderSpotsList = () => {
    const spotsNoSamples = spotsSorted.reduce((acc, s) => !s.properties?.isSample ? [...acc, s] : acc, []);
    return (
      <View style={{flex: 1}}>
        <SpotFilters
          activeSpots={spotsNoSamples}
          setIsReverseSort={setIsReverseSort}
          setSpotsSorted={setSpotsSorted}
          setTextNoSpots={setTextNoSpots}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
        <SectionDivider
          dividerText={spotsNoSamples.length + ' Visible ' + (spotsNoSamples.length === 1 ? 'Spot' : 'Spots')}
        />
        <View style={{flex: 1}}>
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={textNoSpots + ' found'}/>}
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

  return (
    <>
      {isEmpty(activeSpots) ? renderNoSpotsText() : renderSpotsList()}
    </>
  );
};

export default SpotsList;
