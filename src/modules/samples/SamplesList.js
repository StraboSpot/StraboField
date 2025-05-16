import React, {useState} from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import IGSNDisplay from './IGSNDisplay';
import sampleStyles from './samples.styles';
import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const SamplesList = ({onPress, page, openModal}) => {
  const spot = useSelector(state => state.spot.selectedSpot);

  const [selectedItem, setSelectedItem] = useState(null);

  const samples = spot?.properties?.samples || [];
  const renderSamplesListItem = (item) => {
    let oriented = item.oriented_sample === 'yes' ? 'Oriented' : 'Unoriented';
    return (
      <>
        <ListItem
          containerStyle={commonStyles.listItem}
          key={item.id}
          onPress={() => onPress(item)}
          pad={5}
        >
          <ListItem.Content style={sampleStyles.listContentContainer}>
            <View>
              <ListItem.Title titleStyle={{
                ...commonStyles.listItemTitle,
                textAlign: 'left',
              }}>{item.sample_id_name || 'Unknown'}</ListItem.Title>
              <ListItem.Subtitle>
                {oriented} - {item.sample_description ? truncateText(item.sample_description, 25) : 'No Description'}
              </ListItem.Subtitle>
            </View>
            <View>
              <IGSNDisplay item={item} openModal={openModal}/>
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
        keyExtractor={item => item.id}
        data={samples.slice().sort(
          (a, b) => (a.sample_id_name || 'Unknown').localeCompare((b.sample_id_name || 'Unknown')))}
        renderItem={({item}) => renderSamplesListItem(item)}
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Samples'}/>}
      />
    </>
  );
};

export default SamplesList;
