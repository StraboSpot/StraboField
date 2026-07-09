import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {SearchBar} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {useSpots} from '.';
import SortingButtons from './SortingButtons';
import {SORT_ORDER, SORTED_VIEWS} from './spots.constants';
import {isEmpty} from '../../shared/helpers';
import {DARKGREY, PRIMARY_TEXT_SIZE, SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import PickerOverlay from '../../shared/ui/modals/PickerOverlay';
import UpdateSpotsInMapExtentButton from '../../shared/ui/UpdateSpotsInMapExtentButton';

const SpotFilters = ({
                       activeSpots,
                       isImagesSearch,
                       isSamplesSearch,
                       setSpotsSorted,
                       setTextNoSpots,
                       updateSpotsInMapExtent,
                     }) => {
  /* Data Hooks */

  const recentViews = useSelector(state => state.spot.recentViews);
  const sortedView = useSelector(state => state.mainMenu.sortedView);
  const spots = useSelector(state => state.spot.spots);
  const spotsInMapExtentIds = useSelector(state => state.map.spotsInMapExtentIds);

  const {
    getRecentSpots,
    getSpotsInMapExtent,
    sortSpotsAlphabetically,
    sortSpotsByDateCreated,
    sortSpotsByDateLastModified,
    sortSpotsByRecentlyViewed,
  } = useSpots();

  /* Local State */

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isReverseSort, setIsReverseSort] = useState(false);
  const [searchState, setSearchState] = useState('');
  const [sortOrder, setSortOrder] = useState('Date Created');
  const [spotsFiltered, setSpotsFiltered] = useState(activeSpots);

  /* Derived Variables */

  let searchPlaceholder = 'Search Spots';
  if (isSamplesSearch) searchPlaceholder = 'Search Samples';
  else if (isImagesSearch) searchPlaceholder = 'Search Images';

  /* Side Effects */

  useEffect(() => {
    let gotSpotsFiltered = activeSpots;
    setTextNoSpots('No Spots in Active Datasets');
    if (sortedView === SORTED_VIEWS.MAP_EXTENT) {
      const extentIds = new Set(getSpotsInMapExtent().filter(Boolean).map(s => s.properties.id.toString()));
      gotSpotsFiltered = activeSpots.filter(s => extentIds.has(s.properties.id.toString()));
      setTextNoSpots('No Active Spots in Current Map Extent');
    }
    else if (sortedView === SORTED_VIEWS.RECENT_VIEWS) {
      const recentIds = new Set(getRecentSpots().filter(Boolean).map(s => s.properties.id.toString()));
      gotSpotsFiltered = activeSpots.filter(s => recentIds.has(s.properties.id.toString()));
      setTextNoSpots('No Recently Viewed Active Spots');
    }
    setSpotsFiltered(gotSpotsFiltered);
    updateSearch(undefined, gotSpotsFiltered);
  }, [recentViews, sortedView, spots, spotsInMapExtentIds]);

  /* Logic Helpers */

  const closePicker = () => setIsPickerVisible(false);

  const openPicker = () => setIsPickerVisible(true);

  const toggleReverseSort = () => {
    const newReverse = !isReverseSort;
    setIsReverseSort(newReverse);
    setSpotsSorted(getSortedSpots(sortOrder, getSearchedSpots(searchState, spotsFiltered), newReverse));
  };

  const getSearchedSpots = (search, spotsToSearch) => {
    if (isEmpty(search)) return spotsToSearch;
    const query = search.toLowerCase();
    // For Samples/Images searches, keep only the matching child items under their parent Spot.
    if (isSamplesSearch) {
      return spotsToSearch.reduce((acc, spot) => {
        const isSampleSpotMatch = spot.properties?.isSample && spot.properties?.name?.toLowerCase().includes(query);
        const matchingSamples = spot.properties.samples?.filter(
          smpl => smpl.sample_id_name?.toLowerCase().includes(query)
            || spots[smpl.id]?.properties?.samples[0]?.sample_id_name?.toLowerCase().includes(query)) || [];
        if (isSampleSpotMatch || !isEmpty(matchingSamples)) {
          acc.push({...spot, properties: {...spot.properties, samples: matchingSamples}});
        }
        return acc;
      }, []);
    }
    if (isImagesSearch) {
      return spotsToSearch.reduce((acc, spot) => {
        const matchingImages = spot.properties.images?.filter(
          image => image.title?.toLowerCase().includes(query)) || [];
        if (!isEmpty(matchingImages)) acc.push({...spot, properties: {...spot.properties, images: matchingImages}});
        return acc;
      }, []);
    }
    return spotsToSearch.filter(spot => spot.properties?.name?.toLowerCase().includes(query));
  };

  const getSortedSpots = (sort, spotsToSort, reverse = false) => {
    let gotSpotsSorted = [...spotsToSort];
    if (sort === SORT_ORDER.ALPHABETICAL) gotSpotsSorted = sortSpotsAlphabetically(gotSpotsSorted);
    else if (sort === SORT_ORDER.DATE_CREATED) gotSpotsSorted = sortSpotsByDateCreated(gotSpotsSorted);
    else if (sort === SORT_ORDER.DATE_LAST_MODIFIED) gotSpotsSorted = sortSpotsByDateLastModified(gotSpotsSorted);
    else if (sort === SORT_ORDER.RECENTLY_VIEWED) gotSpotsSorted = sortSpotsByRecentlyViewed(gotSpotsSorted);
    return reverse ? gotSpotsSorted.reverse() : gotSpotsSorted;
  };

  const updateSearch = (search = searchState, spotsToSearch = spotsFiltered) => {
    setSearchState(search);
    setSpotsSorted(getSortedSpots(sortOrder, getSearchedSpots(search, spotsToSearch), isReverseSort));
  };

  const updateSort = (sort = sortOrder) => {
    setSortOrder(sort);
    setSpotsSorted(getSortedSpots(sort, getSearchedSpots(searchState, spotsFiltered), isReverseSort));
    closePicker();
  };

  /* View */

  return (
    <>
      <SortingButtons/>
      {sortedView === SORTED_VIEWS.MAP_EXTENT && (
        <UpdateSpotsInMapExtentButton
          title={'Update Spots in Map Extent'}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
      )}
      {!isEmpty(activeSpots) && (
        <>
          <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, marginVertical: -5}}>
            <SearchBar
              containerStyle={{
                backgroundColor: SECONDARY_BACKGROUND_COLOR,
                borderBottomColor: 'transparent',
                borderTopColor: 'transparent',
                flex: 1,
                padding: 0,
              }}
              inputContainerStyle={{backgroundColor: SECONDARY_BACKGROUND_COLOR}}
              inputStyle={{outlineStyle: 'none', fontSize: PRIMARY_TEXT_SIZE}}
              onChangeText={updateSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor={DARKGREY}
              platform={'default'}
              value={searchState}
            />
            <View style={{marginHorizontal: -10}}>
              <ClearButton
                icon={{name: 'sort', type: 'material'}}
                onPress={openPicker}
              />
            </View>
            <View style={{marginHorizontal: -10}}>
              <ClearButton
                icon={{name: 'swap-vert', type: 'material'}}
                onPress={toggleReverseSort}
              />
            </View>
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
      )}
    </>
  );
};

export default SpotFilters;
