import React from 'react';
import {FlatList} from 'react-native';

import {useSelector} from 'react-redux';

import DatasetListItem from './DatasetListItem';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';

const DatasetList = ({setDatasetToView}) => {
  console.log('Rendering DatasetList...');

  /* Data Hooks */

  const datasets = useSelector(state => state.project.datasets) || {};

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      data={Object.values(datasets)}
      keyExtractor={item => item.id}
      renderItem={({item}) => <DatasetListItem dataset={item} setDatasetToView={setDatasetToView}/>}
    />
  );
};

export default DatasetList;
