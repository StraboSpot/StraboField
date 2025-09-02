import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {Button, Icon, SearchBar} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {useSpots} from '.';
import SortingButtons from './SortingButtons';
import {SORT_ORDER, SORTED_VIEWS} from './spots.constants';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import {
  DARKGREY,
  PRIMARY_BACKGROUND_COLOR,
} from '../../shared/styles.constants';
import PickerOverlay from '../../shared/ui/PickerOverlay';
import UpdateSpotsInMapExtentButton from '../../shared/ui/UpdateSpotsInMapExtentButton';

const SpotFilters = ({
                       activeSpots,
                       setIsReverseSort,
                       setSpotsSearched,
                       setSpotsSorted,
                       setTextNoSpots,
                       spotsSearched,
                       updateSpotsInMapExtent,
                     }) => {
  const {
    getRecentSpots,
    getSpotsInMapExtent,
    sortSpotsAlphabetically,
    sortSpotsByDateCreated,
    sortSpotsByDateLastModified,
    sortSpotsByRecentlyViewed,
  } = useSpots();

  const recentViews = useSelector(state => state.spot.recentViews);
  const sortedView = useSelector(state => state.mainMenu.sortedView);
  const spots = useSelector(state => state.spot.spots);
  const spotsInMapExtentIds = useSelector(state => state.map.spotsInMapExtentIds);

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [searchState, setSearchState] = useState('');
  const [sortOrder, setSortOrder] = useState('Date Created');
  const [spotsFiltered, setSpotsFiltered] = useState(activeSpots);

  useEffect(() => {
    let gotSpotsFiltered = activeSpots;
    setTextNoSpots('No Spots in Active Datasets');
    if (sortedView === SORTED_VIEWS.MAP_EXTENT) {
      gotSpotsFiltered = getSpotsInMapExtent();
      setTextNoSpots('No active Spots in current map extent');
    }
    else if (sortedView === SORTED_VIEWS.RECENT_VIEWS) {
      gotSpotsFiltered = getRecentSpots();
      setTextNoSpots('No recently viewed active Spots');
    }
    setSpotsFiltered(gotSpotsFiltered);
    updateSearch(undefined, gotSpotsFiltered);
  }, [recentViews, sortedView, spots, spotsInMapExtentIds]);

  const toggleReverseSort = () => {
    setIsReverseSort(prevState => !prevState);
  };

  const openPicker = () => {
    setIsPickerVisible(true);
  };

  const closePicker = () => {
    setIsPickerVisible(false);
  };

  const updateSearch = (search = searchState, spotsToSearch = spotsFiltered) => {
    setSearchState(search);
    let gotSpotsSearched;
    if (isEmpty(search)) gotSpotsSearched = spotsToSearch;
    else {
      gotSpotsSearched = spotsToSearch.filter(
        spot => spot.properties?.name?.toLowerCase().includes(search.toLowerCase()));
    }
    setSpotsSearched(gotSpotsSearched);
    updateSort(undefined, gotSpotsSearched);
  };

  const updateSort = (sort = sortOrder, spotsToSort = spotsSearched) => {
    setSortOrder(sort);
    let gotSpotsSorted = [...spotsToSort];
    if (sort === SORT_ORDER.ALPHABETICAL) gotSpotsSorted = sortSpotsAlphabetically(gotSpotsSorted);
    else if (sort === SORT_ORDER.DATE_CREATED) gotSpotsSorted = sortSpotsByDateCreated(gotSpotsSorted);
    else if (sort === SORT_ORDER.DATE_LAST_MODIFIED) gotSpotsSorted = sortSpotsByDateLastModified(gotSpotsSorted);
    else if (sort === SORT_ORDER.RECENTLY_VIEWED) gotSpotsSorted = sortSpotsByRecentlyViewed(gotSpotsSorted);
    setSpotsSorted(gotSpotsSorted);
    closePicker();
  };

  return (
    <>
      <SortingButtons/>
      {sortedView === SORTED_VIEWS.MAP_EXTENT && (
        <UpdateSpotsInMapExtentButton
          title={'Update Spots in Map Extent'}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
      )}
      <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, marginVertical: -5}}>
        <SearchBar
          containerStyle={{
            backgroundColor: PRIMARY_BACKGROUND_COLOR,
            borderBottomColor: 'transparent',
            borderTopColor: 'transparent',
            flex: 1,
            padding: 0,
          }}
          inputContainerStyle={{backgroundColor: PRIMARY_BACKGROUND_COLOR}}
          inputStyle={{backgroundColor: PRIMARY_BACKGROUND_COLOR, outlineStyle: 'none'}}
          onChangeText={updateSearch}
          placeholder={'Search Spot Names'}
          placeholderTextColor={DARKGREY}
          platform={'default'}
          value={searchState}
        />
        <Button
          icon={(
            <Icon
              color={themes.PRIMARY_TEXT_COLOR}
              name={'sort'}
              type={'material'}
            />
          )}
          onPress={openPicker}
          size={'sm'}
          type={'clear'}
        />
        <Button
          icon={(
            <Icon
              color={themes.PRIMARY_TEXT_COLOR}
              name={'swap-vert'}
              type={'material'}
            />
          )}
          onPress={toggleReverseSort}
          size={'sm'}
          type={'clear'}
        />
      </View>
      <PickerOverlay
        closePicker={closePicker}
        data={Object.values(SORT_ORDER)}
        dividerText={'Sort'}
        isPickerVisible={isPickerVisible}
        onSelect={item => updateSort(item)}
        value={sortOrder}
      />
    </>
  );
};

export default SpotFilters;
