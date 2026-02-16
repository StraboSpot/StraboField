import React, {useEffect, useState} from 'react';
import {FlatList} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {deepFindFeatureTypeById, isEmpty} from '../../shared/Helpers';
import {NotebookPageAvatar} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import useProject from '../project/useProject';
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

  const {isSpotInReadOnlyDataset} = useProject();

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
      const isReadOnly = isSpotInReadOnlyDataset(spot.properties.id);
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
          {isReadOnly ? (
            <>
              <Icon
                containerStyle={{justifyContent: 'center', paddingRight: 5}}
                name={'lock-closed'}
                size={12}
                type={'ionicon'}
              />
              <ListItem.Chevron/>
            </>
          ) : <ListItem.Chevron/>
          }
        </ListItem>
      );
    }
  };

  const renderSpotItem = (id) => {
    const spot = getSpotById(id);
    return (
      <SpotsListItem
        doShowTags={true}
        onPress={openSpot}
        spot={spot}
      />
    );
  };

  const renderTaggedFeaturesList = () => {
    return (
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Features'}/>}
        data={getAllTaggedFeatures(selectedTag)}
        keyExtractor={item => 'Feature' + item.id.toString()}
        listKey={'features'}
        renderItem={({item}) => renderSpotFeatureItem(item)}
      />
    );
  };

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <SectionDividerWithRightButton
            buttonTitle={'View/Edit'}
            dividerText={selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? 'Geologic Unit Info' : 'Tag Info'}
            onPress={setIsDetailModalVisible}
          />
          {selectedTag && renderTagInfo()}
          <SectionDividerWithRightButton
            buttonTitle={'Add/Remove'}
            dividerText={selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? 'Spots With\nGeologic Unit' : 'Tagged Spots'}
            onPress={addRemoveSpots}
          />
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={'No Spots'}/>}
            data={selectedTag.spots && selectedTag.spots.filter(spotId => spots[spotId])}
            keyExtractor={item => 'Spot' + item.toString()}
            listKey={'spots'}
            renderItem={({item}) => renderSpotItem(item)}
          />
          {selectedTag.type !== PAGE_KEYS.GEOLOGIC_UNITS && (
            <>
              <SectionDividerWithRightButton
                buttonTitle={'Add/Remove'}
                dividerText={'Tagged Features'}
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
