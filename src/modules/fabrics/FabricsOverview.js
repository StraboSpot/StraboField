import React from 'react';
import {FlatList} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import FabricListItem from './FabricListItem';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {setSelectedAttributes} from '../spots/spots.slice';

const FabricsOverview = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Derived Variables */

  const fabrics = [...(spot?.properties?.fabrics || []),
    ...(spot?.properties?._3d_structures?.filter(struct => struct.type === 'fabric') || [])];

  /* Event Handlers */

  const onFabricPressed = (fabric) => {
    dispatch(setSelectedAttributes([fabric]));
    dispatch(setNotebookPageVisible(page.key));
  };

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={<ListEmptyText text={'No Fabrics'}/>}
      data={fabrics}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => <FabricListItem editFabric={() => onFabricPressed(item)} fabric={item}/>}
    />
  );
};

export default FabricsOverview;
