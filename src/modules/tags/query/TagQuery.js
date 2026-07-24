import React, {useEffect, useState} from 'react';

import {TAG_FILTER_LABELS, TAG_SORT_ORDER} from './tagQuery.constants';
import {sortTagsByOrder} from './tagQuery.helpers';
import {isEmpty} from '../../../shared/helpers';
import ListQueryBar from '../../../shared/ui/ListQueryBar';
import {getTagTitle} from '../tags.helpers';

const TagQuery = ({activeFilters, isGeologicUnits, setActiveFilters, setTagsSorted, tags}) => {
  /* Local State */

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [searchState, setSearchState] = useState('');
  const [sortOrder, setSortOrder] = useState(isGeologicUnits ? TAG_SORT_ORDER.TEMPORAL : TAG_SORT_ORDER.ALPHABETICAL);
  const [tagsFiltered, setTagsFiltered] = useState(tags);

  /* Derived Variables */

  const filterOptions = Object.values(TAG_FILTER_LABELS);

  const sortOptions = isGeologicUnits ? Object.values(TAG_SORT_ORDER)
    : Object.values(TAG_SORT_ORDER).filter(v => v !== TAG_SORT_ORDER.TEMPORAL);

  /* Side Effects */

  useEffect(() => {
    const filtered = applySearch(searchState, tags);
    setTagsFiltered(filtered);
    setTagsSorted(sortTagsByOrder(filtered, sortOrder, isReverseSort));
  }, [tags]);

  /* Logic Helpers */

  const applySearch = (search, tagsToSearch) => {
    if (isEmpty(search)) return tagsToSearch;
    return tagsToSearch.filter(t => getTagTitle(t).toLowerCase().includes(search.toLowerCase()));
  };

  const clearFilter = () => setActiveFilters([]);

  const toggleFilter = (label) => {
    const filter = Object.keys(TAG_FILTER_LABELS).find(key => TAG_FILTER_LABELS[key] === label);
    const newFilters = activeFilters.includes(filter) ? activeFilters.filter(f => f !== filter)
      : [...activeFilters, filter];
    setActiveFilters(newFilters);
  };

  const toggleReverseSort = () => {
    const newReverse = !isReverseSort;
    setIsReverseSort(newReverse);
    setTagsSorted(sortTagsByOrder(tagsFiltered, sortOrder, newReverse));
  };

  const updateSearch = (search) => {
    setSearchState(search);
    const filtered = applySearch(search, tags);
    setTagsFiltered(filtered);
    setTagsSorted(sortTagsByOrder(filtered, sortOrder, isReverseSort));
  };

  const updateSort = (sort) => {
    setSortOrder(sort);
    setTagsSorted(sortTagsByOrder(tagsFiltered, sort, isReverseSort));
  };

  /* View */

  return (
    <ListQueryBar
      filterOptions={filterOptions}
      filterTitle={isGeologicUnits ? 'Geologic Unit Filters' : 'Tag Filters'}
      filterValues={activeFilters.map(filter => TAG_FILTER_LABELS[filter])}
      onFilterClear={clearFilter}
      onFilterToggle={toggleFilter}
      onReversePress={toggleReverseSort}
      onSearchChange={updateSearch}
      onSortSelect={updateSort}
      searchValue={searchState}
      sortOptions={sortOptions}
      sortValue={sortOrder}
    />
  );
};

export default TagQuery;
