import React, {useEffect, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {useSpots} from '.';
import {FILTERS, FILTER_LABELS, PICKER_KEYS, SORT_ORDER} from './spots.constants';
import {isEmpty} from '../../shared/helpers';
import ListQueryBar from '../../shared/ui/ListQueryBar';
import {setListFilters} from '../main-menu-panel/mainMenuPanel.slice';
import {setIsMapExtentFilterActive} from '../maps/maps.slice';

const SpotQuery = ({
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

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [searchState, setSearchState] = useState('');
  const [sortOrder, setSortOrder] = useState('Date Created');
  const [spotsFiltered, setSpotsFiltered] = useState(activeSpots);

  /* Derived Variables */

  // Each page (Spots/Images/Samples) keeps its own filter in Redux so selecting one doesn't affect the others.
  let pageKey = PICKER_KEYS.SPOTS;
  if (isImagesSearch) pageKey = PICKER_KEYS.IMAGES;
  else if (isSamplesSearch) pageKey = PICKER_KEYS.SAMPLES;

  const filterOptions = Object.values(FILTER_LABELS);
  // Filters are multi-select and combine as an intersection; stored as an array of view keys (empty = all).
  const pageFilter = listFilters?.[pageKey];
  const activeFilters = Array.isArray(pageFilter) ? pageFilter : [];

  /* Side Effects */

  useEffect(() => {
    let gotSpotsFiltered = activeSpots;
    // Each active filter narrows the set further, so the result is the intersection of them all.
    if (activeFilters.includes(FILTERS.MAP_EXTENT)) {
      const extentIds = new Set(getSpotsInMapExtent().filter(Boolean).map(s => s.properties.id.toString()));
      gotSpotsFiltered = gotSpotsFiltered.filter(s => extentIds.has(s.properties.id.toString()));
    }
    if (activeFilters.includes(FILTERS.RECENT_VIEWS)) {
      const recentIds = new Set(getRecentSpots().filter(Boolean).map(s => s.properties.id.toString()));
      gotSpotsFiltered = gotSpotsFiltered.filter(s => recentIds.has(s.properties.id.toString()));
    }
    // Empty text means no filter, so the list header/empty text falls back to its own default wording.
    setScopeText?.(activeFilters.map(filter => FILTER_LABELS[filter]).join(' and '));
    setSpotsFiltered(gotSpotsFiltered);
    updateSearch(undefined, gotSpotsFiltered);
  }, [pageFilter, recentViews, spots, spotsInMapExtentIds]);

  // Let the map know a map-extent list is being viewed so it auto-recomputes the extent on move.
  useEffect(() => {
    if (activeFilters.includes(FILTERS.MAP_EXTENT)) {
      dispatch(setIsMapExtentFilterActive(true));
      return () => dispatch(setIsMapExtentFilterActive(false));
    }
  }, [pageFilter]);

  /* Logic Helpers */

  const clearFilter = () => dispatch(setListFilters({page: pageKey, value: []}));

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

  const toggleFilter = (label) => {
    const filter = Object.keys(FILTER_LABELS).find(key => FILTER_LABELS[key] === label);
    const newFilters = activeFilters.includes(filter) ? activeFilters.filter(f => f !== filter)
      : [...activeFilters, filter];
    dispatch(setListFilters({page: pageKey, value: newFilters}));
  };

  const toggleReverseSort = () => {
    const newReverse = !isReverseSort;
    setIsReverseSort(newReverse);
    setSpotsSorted(getSortedSpots(sortOrder, getSearchedSpots(searchState, spotsFiltered), newReverse));
  };

  const updateSearch = (search = searchState, spotsToSearch = spotsFiltered) => {
    setSearchState(search);
    setSpotsSorted(getSortedSpots(sortOrder, getSearchedSpots(search, spotsToSearch), isReverseSort));
  };

  const updateSort = (sort = sortOrder) => {
    setSortOrder(sort);
    setSpotsSorted(getSortedSpots(sort, getSearchedSpots(searchState, spotsFiltered), isReverseSort));
  };

  /* View */

  return (
    <>
      {!isEmpty(activeSpots) && (
        <ListQueryBar
          filterOptions={filterOptions}
          filterValues={activeFilters.map(filter => FILTER_LABELS[filter])}
          onFilterClear={clearFilter}
          onFilterToggle={toggleFilter}
          onReversePress={toggleReverseSort}
          onSearchChange={updateSearch}
          onSortSelect={updateSort}
          searchValue={searchState}
          sortOptions={Object.values(SORT_ORDER)}
          sortValue={sortOrder}
        />
      )}
    </>
  );
};

export default SpotQuery;
