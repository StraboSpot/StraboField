import React, {useEffect, useState} from 'react';
import {FlatList} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {deepFindFeatureTypeById, isEmpty} from '../../shared/Helpers';
import {NotebookPageAvatar} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {deletedSpotIdFromTags} from '../project/projects.slice';
import useProject from '../project/useProject';
import SamplesSectionList from '../samples/SamplesSectionList';
import {SpotsListItem, useSpots} from '../spots';
import {useTags} from '../tags';

const TagDetail = ({
                     addRemoveFeatures,
                     addRemoveSampleSpots,
                     addRemoveSpots,
                     openFeatureDetail,
                     openSpot,
                     openSpotInNotebook,
                     setIsDetailModalVisible,
                   }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);
  const spots = useSelector(state => state.spot.spots);

  const {isSpotInReadOnlyDataset} = useProject();
  const {getSpotById, getSpotWithThisSample} = useSpots();
  const {getAllTaggedFeatures, getFeatureDisplayComponent, renderTagInfo} = useTags();

  /* Local State */

  const [refresh, setRefresh] = useState(false);

  // console.log('selectedTag', selectedTag);
  // selectedTag.spots.map((spotId, index) => console.log(index, spotId, getSpotById(spotId)));

  /* Side Effects */

  useEffect(() => {
    console.log('UE TagDetail [selectedTag]', selectedTag);
    setRefresh(!refresh); // #TODO : Current hack to render two different FlatListComponents when selectedTag Changes.
                          //         To handle the navigation issue from 0 tagged features to non zero tagged features.
  }, [selectedTag]);

  /* Render Functions */

  const renderSamples = () => {
    const sampleSpots = selectedTag.spots?.reduce((acc, spotId) => {
      const spot = spots[spotId];
      if (spot?.properties?.isSample) {
        const parentSpot = getSpotWithThisSample(spotId);
        if (!parentSpot) {
          console.error('Couldn\'t find parent Spot. Was this Sample deleted?', spot);
          // dispatch(deletedSpotIdFromTags(spotId));  // Uncomment this to clean up Samples
          return acc;
        }
        const parentSpotId = parentSpot?.properties?.id;
        return acc[parentSpotId] ? {...acc, [parentSpotId]: [...acc[parentSpotId], spot]}
          : {...acc, [parentSpotId]: [spot]};
      }
      else if (!isEmpty(spot?.properties?.samples)) {
        return {...acc, [spot.properties.id]: spot.properties.samples};
      }
      else return acc;
    }, {});

    let dataSectioned = [];
    if (!isEmpty(sampleSpots)) {
      dataSectioned = Object.keys(sampleSpots).map((parentId) => {
        const parentSpot = spots[parentId];
        return {title: parentSpot.properties.name, data: sampleSpots[parentId], spot: parentSpot};
      });
    }
    return (
      <SamplesSectionList
        dataSectioned={dataSectioned}
        listEmptyText={'No Samples'}
        openSpotInNotebook={openSpotInNotebook}
      />
    );
  };

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

  const renderSpotItem = ({item}) => {
    const spot = getSpotById(item);
    if (!isEmpty(spot)) return <SpotsListItem doShowTags={true} onPress={openSpot} spot={spot}/>;
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

  /* View */

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

          {/* Spots with this Tag */}
          <SectionDividerWithRightButton
            buttonTitle={'Add/Remove'}
            dividerText={selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? 'Spots With\nGeologic Unit' : 'Tagged Spots'}
            onPress={addRemoveSpots}
          />
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={'No Spots'}/>}
            data={selectedTag.spots && selectedTag.spots.filter(
              spotId => spots[spotId] && !spots[spotId].properties.isSample)}
            keyExtractor={item => 'Spot' + item.toString()}
            listKey={'spots'}
            renderItem={renderSpotItem}
          />

          {/* Samples with this Tag */}
          <SectionDividerWithRightButton
            buttonTitle={'Add/Remove'}
            dividerText={selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? 'Samples W/Geologic Unit' : 'Tagged Samples'}
            onPress={addRemoveSampleSpots}
          />
          {renderSamples()}

          {/* Features with this Tag */}
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
