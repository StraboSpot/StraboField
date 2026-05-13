import React from 'react';
import {FlatList, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import DatasetListItem from './DatasetListItem';
import commonStyles from '../../../shared/common.styles';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';

const DatasetList = ({setDatasetToView}) => {
  console.log('Rendering DatasetList...');

  /* Data Hooks */

  const datasets = useSelector(state => state.project.datasets) || {};

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListFooterComponent={
        <View style={{alignItems: 'center', padding: 10}}>
          <Text style={commonStyles.standardDescriptionText}>
            *Starred dataset will be set as the target dataset for new Spots.
          </Text>
        </View>
      }
      data={Object.values(datasets)}
      keyExtractor={item => item.id}
      renderItem={({item}) => <DatasetListItem dataset={item} setDatasetToView={setDatasetToView}/>}
    />
  );
};

export default DatasetList;
