import React from 'react';
import {FlatList, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import DatasetPreferencesListItem from './DatasetPreferencesListItem';
import {truncateText} from '../../../shared/Helpers';
import {MEDIUM_TEXT_SIZE, PRIMARY_TEXT_COLOR} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../../shared/ui/SectionDivider';

const DatasetPreferences = () => {
  console.log('Rendering DatasetPreferencesModal...');

  const {datasets, project} = useSelector(state => state.project) || {};

  return (
    <View style={{flex: 1}}>
      <View style={{paddingHorizontal: 10, paddingBottom: 10, alignItems: 'center'}}>
        <Text style={{color: PRIMARY_TEXT_COLOR, fontSize: MEDIUM_TEXT_SIZE}}>
          All settings may be modified later on the Datasets page. Images may also be downloaded later
          from the Datasets page or individually from the Images page or in the Notebook. The Target
          dataset will be used for new Spots.
        </Text>
      </View>
      <View style={{flex: 1}}>
        <SectionDivider
          dividerText={`Datasets for project:  ${truncateText(project.description.project_name, 20)}`}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          data={Object.values(datasets)}
          keyExtractor={item => item.id}
          renderItem={({item}) => <DatasetPreferencesListItem dataset={item}/>}
        />
      </View>
    </View>
  );
};

export default DatasetPreferences;
