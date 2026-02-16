import React from 'react';
import {FlatList} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ThreeDStructureItem from './ThreeDStructureItem';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {setSelectedAttributes} from '../spots/spots.slice';

const ThreeDStructuresOverview = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Derived Variables */

  const threeDStructures = spot?.properties?._3d_structures?.filter(d => d.type !== 'fabric') || [];

  /* Logic Helpers */

  const on3DStructurePressed = (threeDStructure) => {
    dispatch(setSelectedAttributes([threeDStructure]));
    dispatch(setNotebookPageVisible(page.key));
  };

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={<ListEmptyText text={'No 3D Structures yet'}/>}
      data={threeDStructures}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => <ThreeDStructureItem edit3dStructure={() => on3DStructurePressed(item)} item={item}/>}
    />
  );
};

export default ThreeDStructuresOverview;
