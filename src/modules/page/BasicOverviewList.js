import React from 'react';
import {FlatList} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import BasicListItem from './BasicListItem';
import {PET_PAGES, SED_PAGES} from './page.constants';
import {PAGE_KEYS} from './pageKeys.constants';
import {getNewUUID, isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';

const BasicOverviewList = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Derived Variables */

  const isPet = PET_PAGES.find(p => p.key === page.key);
  const isSed = SED_PAGES.find(p => p.key === page.key);

  /* Event Handlers */

  const onItemPressed = (item, i) => {
    if (isSed && !item.id && page.key !== PAGE_KEYS.STRAT_SECTION && page.key !== PAGE_KEYS.INTERVAL) {
      addIdForSS1ImportedSedData(item, i);
    }
    else dispatch(setSelectedAttributes([item]));
    dispatch(setNotebookPageVisible(page.key));
  };

  /* Logic Helpers */

  const addIdForSS1ImportedSedData = (item, i) => {
    let editedSedData = JSON.parse(JSON.stringify(spot.properties.sed));
    item = {...item, id: getNewUUID()};
    if (page.key === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY) editedSedData[PAGE_KEYS.LITHOLOGIES].splice(i, 1, item);
    else if (page.key === PAGE_KEYS.BEDDING) editedSedData[page.key].beds.splice(i, 1, item);
    else editedSedData[page.key].splice(i, 1, item);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
    dispatch(setSelectedAttributes([item]));
  };

  const getData = () => {
    let data = spot.properties[page.key] || [];
    if (isPet && spot.properties.pet) {
      data = spot.properties.pet[page.key] || [];
      const deprecatedRockData = (page.key === PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE
        || page.key === PAGE_KEYS.ROCK_TYPE_IGNEOUS || page.key === PAGE_KEYS.ROCK_TYPE_METAMORPHIC)
      && spot.properties.pet?.rock_type?.includes(page.key) ? spot.properties.pet : {};
      if (!isEmpty(deprecatedRockData)) data = [spot.properties.pet, ...data];
    }
    else if (isSed && spot.properties.sed) data = spot.properties.sed[page.key] || [];
    if (page.key === PAGE_KEYS.STRAT_SECTION) data = [data];
    else if (page.key === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY) data = spot.properties.sed[PAGE_KEYS.LITHOLOGIES] || [];
    else if (page.key === PAGE_KEYS.BEDDING && spot.properties?.sed[page.key]
      && spot.properties?.sed[page.key].beds) data = spot.properties.sed[page.key].beds || [];

    if (!Array.isArray(data)) data = [];
    return data;
  };

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={<ListEmptyText text={'No ' + page.label}/>}
      data={getData()}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item, index}) => (
        <BasicListItem
          editItem={itemToEdit => onItemPressed(itemToEdit, index)}
          index={index}
          item={item}
          page={page}
        />
      )}
    />
  );
};

export default BasicOverviewList;
