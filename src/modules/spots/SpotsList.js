import React, {useState} from 'react';
import {FlatList, View} from 'react-native';

import {SpotsListItem, useSpots} from '.';
import SpotFilters from './SpotFilters';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';

const SpotsList = ({checkedItems, isCheckedList, onChecked, onPress, updateSpotsInMapExtent}) => {
  // console.log('Rendering SpotsList...');

  /* Data Hooks */

  const {getActiveSpotsObj} = useSpots();

  /* Local State */

  const [isReverseSort, setIsReverseSort] = useState(false);

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);

  const [spotsSearched, setSpotsSearched] = useState(activeSpots);
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Visible Datasets');

  /* Render Functions */

  const renderNoSpotsText = () => <ListEmptyText text={textNoSpots}/>;

  const renderSpotsList = () => {
    return (
      <View style={{flex: 1}}>
        <SpotFilters
          activeSpots={activeSpots}
          setIsReverseSort={setIsReverseSort}
          setSpotsSearched={setSpotsSearched}
          setSpotsSorted={setSpotsSorted}
          setTextNoSpots={setTextNoSpots}
          spotsSearched={spotsSearched}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
        <SectionDivider
          dividerText={spotsSearched.length + ' Visible ' + (spotsSearched.length === 1 ? 'Spot' : 'Spots')}
        />
        <View style={{flex: 1}}>
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={textNoSpots + ' found'}/>}
            data={isReverseSort ? [...spotsSorted].reverse() : spotsSorted}
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

  /* View */

  return (
    <>
      {isEmpty(activeSpots) ? renderNoSpotsText() : renderSpotsList()}
    </>
  );
};

export default SpotsList;
