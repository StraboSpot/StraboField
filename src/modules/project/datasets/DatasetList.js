import React from 'react';
import {FlatList, View} from 'react-native';

import {useSelector} from 'react-redux';

import DatasetListItem from './DatasetListItem';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';

const DatasetList = ({setDatasetToView}) => {
  console.log('Rendering DatasetList...');

  const datasets = useSelector(state => state.project.datasets) || {};

  return (
    <View>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        data={Object.values(datasets)}
        keyExtractor={item => item.id}
        renderItem={({item}) => <DatasetListItem dataset={item} setDatasetToView={setDatasetToView}/>}
      />
     </View>
  );
};

export default DatasetList;
