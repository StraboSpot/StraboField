import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {SearchBar} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {useSpots} from '.';
import {PICKER_KEYS, SORT_ORDER, SORTED_VIEW_LABELS, SORTED_VIEWS} from './spots.constants';
import {isEmpty} from '../../shared/helpers';
import {
  DARKGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_TEXT_SIZE,
  SECONDARY_BACKGROUND_COLOR,
  WHITE,
} from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import HorizontalLine from '../../shared/ui/HorizontalLine';
import PickerOverlay from '../../shared/ui/modals/PickerOverlay';
import {setListFilters} from '../main-menu-panel/mainMenuPanel.slice';
import {setIsMapExtentFilterActive} from '../maps/maps.slice';

const SpotFilters = ({
                       activeSpots,
                       isImagesSearch,
                       isSamplesSearch,
                       setScopeText,
                       setSpotsSorted,
                     }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const listFilters = useSelector(state => state.mainMenu.listFilters);
  const recentViews = useSelector(state => state.spot.recentViews);
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

  const [isFilterPickerVisible, setIsFilterPickerVisible] = useState(false);
  const [isReverseSort, setIsReverseSort] = useState(false);
  const [isSortPickerVisible, setIsSortPickerVisible] = useState(false);
  const [searchState, setSearchState] = useState('');
  const [sortOrder, setSortOrder] = useState('Date Created');
  const [spotsFiltered, setSpotsFiltered] = useState(activeSpots);

  /* Derived Variables */

  // Each page (Spots/Images/Samples) keeps its own filter in Redux so selecting one doesn't affect the others.
  let pageKey = PICKER_KEYS.SPOTS;
  if (isImagesSearch) pageKey = PICKER_KEYS.IMAGES;
  else if (isSamplesSearch) pageKey = PICKER_KEYS.SAMPLES;
  let searchPlaceholder = 'Search Spots';
  if (isSamplesSearch) searchPlaceholder = 'Search Samples';
  else if (isImagesSearch) searchPlaceholder = 'Search Images';

  // The default (unfiltered) view is not offered as a filter option; it's reached via the Clear Filter button.
  const filterOptions = Object.values(SORTED_VIEW_LABELS)
    .filter(label => label !== SORTED_VIEW_LABELS[SORTED_VIEWS.CHRONOLOGICAL]);
  const sortedView = (listFilters && listFilters[pageKey]) || SORTED_VIEWS.CHRONOLOGICAL;
  const isFilterActive = sortedView !== SORTED_VIEWS.CHRONOLOGICAL;

  /* Side Effects */

  useEffect(() => {
    let gotSpotsFiltered = activeSpots;
    // Empty string means no filter, so the list header/empty text falls back to its own default wording.
    setScopeText?.('');
    if (sortedView === SORTED_VIEWS.MAP_EXTENT) {
      const extentIds = new Set(getSpotsInMapExtent().filter(Boolean).map(s => s.properties.id.toString()));
      gotSpotsFiltered = activeSpots.filter(s => extentIds.has(s.properties.id.toString()));
      setScopeText?.('Map Extent');
    }
    else if (sortedView === SORTED_VIEWS.RECENT_VIEWS) {
      const recentIds = new Set(getRecentSpots().filter(Boolean).map(s => s.properties.id.toString()));
      gotSpotsFiltered = activeSpots.filter(s => recentIds.has(s.properties.id.toString()));
      setScopeText?.('Recent Views');
    }
    setSpotsFiltered(gotSpotsFiltered);
    updateSearch(undefined, gotSpotsFiltered);
  }, [recentViews, sortedView, spots, spotsInMapExtentIds]);

  // Let the map know a map-extent list is being viewed so it auto-recomputes the extent on move.
  useEffect(() => {
    if (sortedView === SORTED_VIEWS.MAP_EXTENT) {
      dispatch(setIsMapExtentFilterActive(true));
      return () => dispatch(setIsMapExtentFilterActive(false));
    }
  }, [sortedView]);

  /* Logic Helpers */

  const clearFilter = () => {
    dispatch(setListFilters({page: pageKey, value: SORTED_VIEWS.CHRONOLOGICAL}));
    closeFilterPicker();
  };

  const closeFilterPicker = () => setIsFilterPickerVisible(false);

  const closeSortPicker = () => setIsSortPickerVisible(false);

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

  const openFilterPicker = () => setIsFilterPickerVisible(true);

  const openSortPicker = () => setIsSortPickerVisible(true);

  const toggleReverseSort = () => {
    const newReverse = !isReverseSort;
    setIsReverseSort(newReverse);
    setSpotsSorted(getSortedSpots(sortOrder, getSearchedSpots(searchState, spotsFiltered), newReverse));
  };

  const updateFilter = (label) => {
    const view = Object.keys(SORTED_VIEW_LABELS).find(key => SORTED_VIEW_LABELS[key] === label);
    dispatch(setListFilters({page: pageKey, value: view}));
    closeFilterPicker();
  };

  const updateSearch = (search = searchState, spotsToSearch = spotsFiltered) => {
    setSearchState(search);
    setSpotsSorted(getSortedSpots(sortOrder, getSearchedSpots(search, spotsToSearch), isReverseSort));
  };

  const updateSort = (sort = sortOrder) => {
    setSortOrder(sort);
    setSpotsSorted(getSortedSpots(sort, getSearchedSpots(searchState, spotsFiltered), isReverseSort));
    closeSortPicker();
  };

  /* View */

  return (
    <>
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
            <View style={{alignItems: 'center', flexDirection: 'row'}}>
              <ClearButton
                icon={{
                  color: isFilterActive ? WHITE : undefined,
                  containerStyle: isFilterActive
                    ? {backgroundColor: PRIMARY_ACCENT_COLOR, borderRadius: 10, marginHorizontal: 0, padding: 5}
                    : {marginHorizontal: 0},
                  name: 'filter-alt',
                  type: 'material',
                }}
                onPress={openFilterPicker}
                size={'xs'}
              />
              <ClearButton
                icon={{containerStyle: {marginHorizontal: 0}, name: 'sort', type: 'material'}}
                onPress={openSortPicker}
                size={'xs'}
              />
              <ClearButton
                icon={{containerStyle: {marginHorizontal: 0}, name: 'swap-vert', type: 'material'}}
                onPress={toggleReverseSort}
                size={'xs'}
              />
            </View>
          </View>
          <HorizontalLine style={{marginTop: 5}}/>
          {/* Modals  */}
          <PickerOverlay
            closePicker={closeFilterPicker}
            data={filterOptions}
            dividerText={'Filters'}
            isPickerVisible={isFilterPickerVisible}
            onClearPress={isFilterActive ? clearFilter : undefined}
            onSelect={item => updateFilter(item)}
            value={isFilterActive ? SORTED_VIEW_LABELS[sortedView] : null}
          />
          <PickerOverlay
            closePicker={closeSortPicker}
            data={Object.values(SORT_ORDER)}
            dividerText={'Sort'}
            isPickerVisible={isSortPickerVisible}
            onSelect={item => updateSort(item)}
            value={sortOrder}
          />
        </>
      )}
    </>
  );
};

export default SpotFilters;
