import React from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import IGSNDisplay from './IGSNDisplay';
import sampleStyles from './samples.styles';
import commonStyles from '../../shared/common.styles';
import {isEmpty, truncateText} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {useSpots} from '../spots';

const SamplesList = ({onPress}) => {
  const spot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);


  const {getSpotWithThisSample} = useSpots();

  let samples = spot?.properties?.samples || [];
  if (!spot.properties?.isSample) {
    samples = samples.map((sample) => {
      const gotEnrichedSample = spots[sample.id];
      return isEmpty(gotEnrichedSample) ? sample : gotEnrichedSample;
    });
  }
  console.log('Samples at this Spot', samples);

  const handleSamplePressed = (item) => {
    const parentSpot = getSpotWithThisSample(spot.properties.id);
    if (!isEmpty(parentSpot) && parentSpot.properties?.isSample) onPress(parentSpot);
    else onPress(item);
    if (item.properties?.isSample) onPress(item);
  };

  const renderSamplesListItem = ({item}) => {
    const sample = item.properties?.isSample ? item.properties.samples[0] : item;
    let oriented = sample.oriented_sample === 'yes' ? 'Oriented' : 'Unoriented';
    return (
      <>
        <ListItem
          containerStyle={commonStyles.listItem}
          key={'Sample' + sample.id}
          onPress={() => onPress(item)}
          pad={5}
        >
          <ListItem.Content style={sampleStyles.listContentContainer}>
            <View>
              <ListItem.Title titleStyle={{...commonStyles.listItemTitle, textAlign: 'left'}}>
                {sample.sample_id_name || 'Unknown'}
              </ListItem.Title>
              <ListItem.Subtitle>
                {oriented} - {sample.sample_description ? truncateText(sample.sample_description,
                25) : 'No Description'}
              </ListItem.Subtitle>
            </View>
            <View>
              <IGSNDisplay item={sample}/>
            </View>
          </ListItem.Content>
          <ListItem.Chevron/>
        </ListItem>
      </>
    );
  };

  return (
    <>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Samples'}/>}
        data={samples.slice().sort(
          (a, b) => (a.sample_id_name || a.properties?.name || 'Unknown').localeCompare(
            (b.sample_id_name || b.properties?.name || 'Unknown')))}
        keyExtractor={item => item.id}
        renderItem={renderSamplesListItem}
      />
    </>
  );
};

export default SamplesList;
