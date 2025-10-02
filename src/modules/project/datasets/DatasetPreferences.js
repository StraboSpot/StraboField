import React from 'react';
import {FlatList, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import DatasetPreferencesListItem from './DatasetPreferencesListItem';
import {MEDIUM_TEXT_SIZE, PRIMARY_TEXT_COLOR} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../../shared/ui/SectionDivider';

const DatasetPreferences = () => {
  console.log('Rendering DatasetPreferencesModal...');

  const datasets = useSelector(state => state.project.datasets) || {};

  return (
    <View style={{flex: 1}}>
      <View style={{paddingHorizontal: 10, paddingBottom: 10, alignItems: 'center'}}>
        <Text style={{color: PRIMARY_TEXT_COLOR, fontSize: MEDIUM_TEXT_SIZE}}>
          All settings may be modified later on the Datasets page. The Target dataset will be used for new Spots.
        </Text>
      </View>
      <SectionDivider dividerText={'Datasets'}/>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        data={Object.values(datasets)}
        keyExtractor={item => item.id}
        renderItem={({item}) => <DatasetPreferencesListItem dataset={item}/>}
      />
    </View>
  );
};

export default DatasetPreferences;
