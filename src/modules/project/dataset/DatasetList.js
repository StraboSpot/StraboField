import React from 'react';
import {FlatList, View} from 'react-native';

import {useSelector} from 'react-redux';

import DatasetListItem from './DatasetListItem';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';

const DatasetList = ({setDatasetToView}) => {
  console.log('Rendering DatasetList...');

  const datasets = useSelector(state => state.project.datasets) || {};

  return (
    // <View style={{flex: 1, backgroundColor: 'red'}}>
      <FlatList
        keyExtractor={item => item.id}
        data={Object.values(datasets)}
        renderItem={({item}) => <DatasetListItem dataset={item} setDatasetToView={setDatasetToView}/>}
        ItemSeparatorComponent={FlatListItemSeparator}
      />
    // </View>
  );
};

export default DatasetList;
