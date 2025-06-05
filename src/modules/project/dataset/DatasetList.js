import React from 'react';
import {FlatList, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import DatasetListItem from './DatasetListItem';
import commonStyles from '../../../shared/common.styles';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';

const DatasetList = ({setDatasetToView}) => {
  console.log('Rendering DatasetList...');

  const datasets = useSelector(state => state.project.datasets) || {};

  return (
    <View style={{flex: 1}}>
      <FlatList
        keyExtractor={item => item.id}
        data={Object.values(datasets)}
        renderItem={({item}) => <DatasetListItem dataset={item} setDatasetToView={setDatasetToView}/>}
        ItemSeparatorComponent={FlatListItemSeparator}
        ListFooterComponent={
          <View style={{alignItems: 'center', paddingVertical: 10}}>
            <Text style={commonStyles.standardDescriptionText}>*New Spots will be added to the stared dataset.</Text>
          </View>
        }
      />
    </View>
  );
};

export default DatasetList;
