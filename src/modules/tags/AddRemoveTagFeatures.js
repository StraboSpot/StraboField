import React from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {deepFindFeatureTypeById, isEmpty} from '../../shared/Helpers';
import {NotebookPageAvatar} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';
import {useSpots} from '../spots';
import {useTags} from '../tags';

const AddRemoveTagFeatures = () => {
  const {getAllFeaturesFromSpot} = useSpots();
  const {addRemoveSpotFeatureFromTag, getFeatureDisplayComponent} = useTags();

  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);
  const spots = useSelector(state => state.spot.spots);

  const renderSpotFeatureItem = (feature) => {
    const spotId = feature.parentSpotId;
    const spot = spots[spotId];
    const selectedTagCopy = JSON.parse(JSON.stringify(selectedTag));
    const featureType = deepFindFeatureTypeById(spot.properties, feature.id);

    if (!isEmpty(spot) && !isEmpty(spot.properties)) {
      return (
        <ListItem
          containerStyle={commonStyles.listItem}
          onPress={() => addRemoveSpotFeatureFromTag(selectedTagCopy, feature, spotId)}
        >
          <NotebookPageAvatar pageKey={featureType}/>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>
              {getFeatureDisplayComponent(featureType, feature)}
            </ListItem.Title>
            <ListItem.Subtitle>{spot.properties.name || spotId}</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.CheckBox
            checked={!isEmpty(selectedTag) && !isEmpty(selectedTag.features)
              && !isEmpty(selectedTag.features[spotId])
              && selectedTag.features[spotId].includes(feature.id)}
            onPress={() => addRemoveSpotFeatureFromTag(selectedTagCopy, feature, spotId)}
          />
        </ListItem>
      );
    }
  };

  return (
    <>
      <SidePanelHeader
        backButton={() => dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_DETAIL}))}
        headerTitle={!isEmpty(selectedTag) && `Add/Remove ${selectedTag.name}`}
        title={`${selectedTag.name}`}
      />
      <View style={{...commonStyles.buttonContainer, flex: 1}}>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'No Features in Active Datasets'}/>}
          data={getAllFeaturesFromSpot()}
          renderItem={({item}) => renderSpotFeatureItem(item)}
        />
      </View>
    </>
  );
};

export default AddRemoveTagFeatures;
