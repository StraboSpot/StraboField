import React, {useEffect, useState} from 'react';
import {FlatList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {deepFindFeatureTypeById, isEmpty} from '../../shared/Helpers';
import {NotebookPageAvatar} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {PAGE_KEYS} from '../page/page.constants';
import {SpotsListItem, useSpots} from '../spots';
import {useTags} from '../tags';

const TagDetail = ({
                     addRemoveFeatures,
                     addRemoveSpots,
                     openFeatureDetail,
                     openSpot,
                     setIsDetailModalVisible,
                   }) => {
  const {getSpotById} = useSpots();
  const {getAllTaggedFeatures, getFeatureDisplayComponent, renderTagInfo} = useTags();

  const selectedTag = useSelector(state => state.project.selectedTag);
  const spots = useSelector(state => state.spot.spots);
  const [refresh, setRefresh] = useState(false);

  // selectedTag.spots.map((x, index) => console.log(index, x, getSpotById(x)));

  useEffect(() => {
    console.log('UE TagDetail [selectedTag]', selectedTag);
    setRefresh(!refresh); // #TODO : Current hack to render two different FlatListComponents when selectedTag Changes.
                          //         To handle the navigation issue from 0 tagged features to non zero tagged features.
  }, [selectedTag]);

  const renderSpotFeatureItem = (feature) => {
    const spot = getSpotById(feature.parentSpotId);
    const featureType = deepFindFeatureTypeById(spot.properties, feature.id);
    if (!isEmpty(spot)) {
      return (
        <ListItem
          containerStyle={commonStyles.listItem}
          key={spot.properties.id}
          onPress={() => openFeatureDetail(spot, feature, featureType)}
        >
          <NotebookPageAvatar pageKey={featureType}/>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>
              {getFeatureDisplayComponent(featureType, feature)}
            </ListItem.Title>
            <ListItem.Subtitle>{spot.properties.name}</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron/>
        </ListItem>
      );
    }
  };

  const renderSpotItem = (id) => {
    const spot = getSpotById(id);
    return (
      <SpotsListItem
        doShowTags={true}
        spot={spot}
        onPress={openSpot}
      />
    );
  };

  const renderTaggedFeaturesList = () => {
    return (
      <FlatList
        listKey={'features'}
        keyExtractor={item => 'Feature' + item.id.toString()}
        data={getAllTaggedFeatures(selectedTag)}
        renderItem={({item}) => renderSpotFeatureItem(item)}
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Features'}/>}
      />
    );
  };

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <SectionDividerWithRightButton
            dividerText={selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? 'Geologic Unit Info' : 'Tag Info'}
            buttonTitle={'View/Edit'}
            onPress={setIsDetailModalVisible}
          />
          {selectedTag && renderTagInfo()}
          <SectionDividerWithRightButton
            dividerText={selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? 'Spots W/Geologic Unit' : 'Tagged Spots'}
            buttonTitle={'Add/Remove'}
            onPress={addRemoveSpots}
          />
          <FlatList
            listKey={'spots'}
            keyExtractor={item => 'Spot' + item.toString()}
            data={selectedTag.spots && selectedTag.spots.filter(spotId => spots[spotId])}
            renderItem={({item}) => renderSpotItem(item)}
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={'No Spots'}/>}
          />
          {selectedTag.type !== PAGE_KEYS.GEOLOGIC_UNITS && (
            <>
              <SectionDividerWithRightButton
                dividerText={'Tagged Features'}
                buttonTitle={'Add/Remove'}
                onPress={addRemoveFeatures}
              />
              {refresh ? renderTaggedFeaturesList() : renderTaggedFeaturesList()}
            </>
          )}
        </>
      }
    />
  );
};

export default TagDetail;
