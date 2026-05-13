import React from 'react';
import {FlatList} from 'react-native';

import {useSelector} from 'react-redux';

import SampleListItem from './SampleListItem';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const SamplesList = ({onPress, onPressEmpty}) => {
  /* Data Hooks */

  const spot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);

  /* Derived Variables */

  let samples = spot?.properties?.samples?.map((sample) => {
    const richSample = spots[sample.id];
    return isEmpty(richSample) ? sample : richSample;
  }) || [];
  const samplesSorted = samples.slice().sort(
    (a, b) => (a.sample_id_name || a.properties?.name || 'Unknown').localeCompare(
      (b.sample_id_name || b.properties?.name || 'Unknown')));

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={<ListEmptyText onPress={onPressEmpty} text={'No Samples'}/>}
      data={samplesSorted}
      keyExtractor={item => 'Sample' + (item.id || item.properties.id)}
      renderItem={({item}) => <SampleListItem isShowSubtitle onPress={onPress} parentSpot={spot} sample={item}/>}
    />
  );
};

export default SamplesList;
