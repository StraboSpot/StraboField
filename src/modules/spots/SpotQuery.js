import React, {useEffect, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {useSpots} from '.';
import {
  FILTERS,
  FILTER_LABELS,
  FILTER_LABELS_SINGULAR,
  IMAGE_DATA_FILTERS,
  IMAGE_TYPE_FILTERS,
  PICKER_KEYS,
  SAMPLE_DATA_FILTERS,
  SORT_ORDER,
  SPOT_DATA_FILTERS,
} from './spots.constants';
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
  const isTestingMode = useSelector(state => state.project.isTestingMode);
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
  let filterTitle = 'Spot Filters';
  if (isImagesSearch) {
    pageKey = PICKER_KEYS.IMAGES;
    filterTitle = 'Image Filters';
  }
  else if (isSamplesSearch) {
    pageKey = PICKER_KEYS.SAMPLES;
    filterTitle = 'Sample Filters';
  }

  // Recent Views stays ungrouped at the top; the Map group filters by where a Spot is mapped and the
  // Spot Data group by what it contains. QA/QC is the only testing-only member of either group.
  const mapFilters = [
    FILTER_LABELS[FILTERS.MAP_EXTENT],
    FILTER_LABELS[FILTERS.MAPPED_ON_IMAGE_BASEMAP],
    FILTER_LABELS[FILTERS.MAPPED_ON_STRAT_SECTION],
  ];
  const spotDataFilters = SPOT_DATA_FILTERS
    .filter(filter => filter !== FILTERS.QAQC || isTestingMode)
    .map(filter => FILTER_LABELS[filter]);
  const imageDataFilters = IMAGE_DATA_FILTERS.map(filter => FILTER_LABELS[filter]);
  const sampleDataFilters = SAMPLE_DATA_FILTERS.map(filter => FILTER_LABELS[filter]);
  // Each page gets its own filter set: Spots have the Map/Spot Data groups, Images add an Image Data group,
  // Samples add a Sample Data group; all start with the two location filters.
  let filterOptions = [FILTER_LABELS[FILTERS.RECENT_VIEWS], FILTER_LABELS[FILTERS.MAP_EXTENT]];
  if (pageKey === PICKER_KEYS.SPOTS) {
    filterOptions = [
      FILTER_LABELS[FILTERS.RECENT_VIEWS],
      {header: 'Map'},
      ...mapFilters,
      {header: 'Spot Data'},
      ...spotDataFilters,
    ];
  }
  else if (pageKey === PICKER_KEYS.IMAGES) {
    filterOptions = [...filterOptions, {header: 'Image Data'}, ...imageDataFilters];
  }
  else if (pageKey === PICKER_KEYS.SAMPLES) {
    filterOptions = [...filterOptions, {header: 'Sample Data'}, ...sampleDataFilters];
  }
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
    // Spot Data filters each keep only Spots that contain that kind of data; QA/QC applies in testing mode only.
    const dataFilterPredicates = {
      [FILTERS.MEASUREMENTS]: s => !isEmpty(s.properties?.orientation_data),
      [FILTERS.NOTES]: s => !isEmpty(s.properties?.notes),
      [FILTERS.STRAT_SECTIONS]: s => !isEmpty(s.properties?.sed?.strat_section),
      [FILTERS.MAPPED_ON_STRAT_SECTION]: s => !isEmpty(s.properties?.strat_section_id),
      [FILTERS.MAPPED_ON_IMAGE_BASEMAP]: s => !isEmpty(s.properties?.image_basemap),
      [FILTERS.QAQC]: s => !isEmpty(s.properties?.qaqc),
    };
    Object.entries(dataFilterPredicates).forEach(([filter, predicate]) => {
      if (filter === FILTERS.QAQC && !isTestingMode) return;
      if (activeFilters.includes(filter)) gotSpotsFiltered = gotSpotsFiltered.filter(predicate);
    });
    // The Images page's Image Data filters narrow to matching images (all active must pass), dropping Spots with none.
    if (isImagesSearch) {
      const imagePredicates = {
        [FILTERS.DESCRIPTION]: image => !isEmpty(image.caption),
        [FILTERS.PHOTO]: image => image.image_type === 'photo',
        [FILTERS.SKETCH]: image => image.image_type === 'sketch',
      };
      const activeImagePredicates = Object.entries(imagePredicates)
        .filter(([filter]) => activeFilters.includes(filter)).map(([, predicate]) => predicate);
      if (!isEmpty(activeImagePredicates)) {
        gotSpotsFiltered = gotSpotsFiltered.reduce((acc, spot) => {
          const matchingImages = spot.properties.images?.filter(
            image => activeImagePredicates.every(predicate => predicate(image))) || [];
          if (!isEmpty(matchingImages)) acc.push({...spot, properties: {...spot.properties, images: matchingImages}});
          return acc;
        }, []);
      }
    }
    // The Samples page's Sample Data filters narrow to matching samples (all active must pass), dropping Spots with none.
    if (isSamplesSearch) {
      const samplePredicates = {
        [FILTERS.SAMPLE_IGSN]: sample => !isEmpty(sample.Sample_IGSN),
        [FILTERS.IS_ON_MY_SESAR]: sample => !!sample.isOnMySesar,
      };
      const activeSamplePredicates = Object.entries(samplePredicates)
        .filter(([filter]) => activeFilters.includes(filter)).map(([, predicate]) => predicate);
      if (!isEmpty(activeSamplePredicates)) {
        gotSpotsFiltered = gotSpotsFiltered.reduce((acc, spot) => {
          const matchingSamples = spot.properties.samples?.filter(
            sample => activeSamplePredicates.every(predicate => predicate(sample))) || [];
          if (!isEmpty(matchingSamples)) acc.push({...spot, properties: {...spot.properties, samples: matchingSamples}});
          return acc;
        }, []);
      }
    }
    // Header scope phrase (incl. preposition): empty when no filter (header falls back to default wording),
    // a count once more than one is active, else the single filter — Map labels carry their own preposition
    // ("on Image Basemaps"), Spot Data filters take "with", everything else "in".
    let scopeText = '';
    if (activeFilters.length > 1) scopeText = `in ${activeFilters.length} filters`;
    else if (activeFilters.length === 1) {
      const filter = activeFilters[0];
      const label = FILTER_LABELS[filter];
      if (/^(In|On) /.test(label)) scopeText = label.charAt(0).toLowerCase() + label.slice(1);
      else if ([...SPOT_DATA_FILTERS, ...IMAGE_DATA_FILTERS, ...SAMPLE_DATA_FILTERS].includes(filter)) {
        // Child-level (image/sample) filters narrow to matching children, so use a singular phrase for a lone match.
        let childCount = 0;
        if (isImagesSearch) gotSpotsFiltered.forEach((spot) => {childCount += spot.properties.images?.length || 0;});
        else if (isSamplesSearch) gotSpotsFiltered.forEach((spot) => {childCount += spot.properties.samples?.length || 0;});
        const singularLabel = FILTER_LABELS_SINGULAR[filter];
        if (IMAGE_TYPE_FILTERS.includes(filter)) {
          scopeText = childCount === 1 ? `that is ${singularLabel}` : `that are ${label}`;
        }
        else scopeText = singularLabel && childCount === 1 ? `with ${singularLabel}` : `with ${label}`;
      }
      else scopeText = `in ${label}`;
    }
    setScopeText?.(scopeText);
    setSpotsFiltered(gotSpotsFiltered);
    updateSearch(undefined, gotSpotsFiltered);
  }, [isTestingMode, pageFilter, recentViews, spots, spotsInMapExtentIds]);

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
          filterTitle={filterTitle}
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
