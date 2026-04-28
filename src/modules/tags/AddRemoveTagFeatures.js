import React from 'react';
import {FlatList, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {deepFindFeatureTypeById, isEmpty} from '../../shared/helpers';
import {MEDIUMGREY} from '../../shared/styles.constants';
import {NotebookPageAvatar} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';
import useProject from '../project/useProject';
import {useSpots} from '../spots';
import {useTags} from '../tags';

const AddRemoveTagFeatures = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);
  const spots = useSelector(state => state.spot.spots);

  const {isSpotInReadOnlyDataset} = useProject();
  const {getAllFeaturesFromSpot} = useSpots();
  const {addRemoveSpotFeatureFromTag, getFeatureDisplayComponent} = useTags();

  /* Render Functions */

  const renderSpotFeatureItem = (feature) => {
    const spotId = feature.parentSpotId;
    const spot = spots[spotId];
    const selectedTagCopy = JSON.parse(JSON.stringify(selectedTag));
    const featureType = deepFindFeatureTypeById(spot.properties, feature.id);
    const isReadOnly = isSpotInReadOnlyDataset(spot.properties.id);

    if (!isEmpty(spot) && !isEmpty(spot.properties)) {
      return (
        <ListItem
          containerStyle={commonStyles.listItem}
          onPress={() => !isReadOnly && addRemoveSpotFeatureFromTag(selectedTagCopy, feature, spotId)}
        >
          <NotebookPageAvatar pageKey={featureType}/>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>
              {getFeatureDisplayComponent(featureType, feature)}
            </ListItem.Title>
            <ListItem.Subtitle>{spot.properties.name || spotId}</ListItem.Subtitle>
          </ListItem.Content>
          <>
            {isReadOnly && (
              <Icon
                color={MEDIUMGREY}
                containerStyle={{justifyContent: 'center', paddingRight: 5}}
                name={'lock-closed'}
                size={20}
                type={'ionicon'}
              />
            )}
            <ListItem.CheckBox
              checked={!isEmpty(selectedTag) && !isEmpty(selectedTag.features)
                && !isEmpty(selectedTag.features[spotId])
                && selectedTag.features[spotId].includes(feature.id)}
              disabled={isReadOnly}
              onPress={() => addRemoveSpotFeatureFromTag(selectedTagCopy, feature, spotId)}
            />
          </>
        </ListItem>
      );
    }
  };

  /* View */

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
          ListEmptyComponent={<ListEmptyText text={'No Features in Visible Datasets'}/>}
          data={getAllFeaturesFromSpot()}
          renderItem={({item}) => renderSpotFeatureItem(item)}
        />
      </View>
    </>
  );
};

export default AddRemoveTagFeatures;
