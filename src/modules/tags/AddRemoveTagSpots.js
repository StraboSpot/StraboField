import React from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';
import {SpotsList} from '../spots';
import {useTags} from '../tags';

const AddRemoveTagSpots = ({updateSpotsInMapExtent}) => {
  /* Data Hooks / State */

  const dispatch = useDispatch();

  const selectedTag = useSelector(state => state.project.selectedTag);

  const {addRemoveSpotFromTag} = useTags();

  /* Event Handlers */

  const handleSpotChecked = spot => addRemoveSpotFromTag(spot.properties.id, selectedTag);

  /* View */

  return (
    <View style={{flex: 1}}>
      <SidePanelHeader
        backButton={() => dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_DETAIL}))}
        headerTitle={!isEmpty(selectedTag) && `Add/Remove ${selectedTag.name}`}
        title={`${selectedTag.name}`}
      />
      <View style={{...commonStyles.buttonContainer, flex: 1}}>
        <SpotsList
          checkedItems={selectedTag?.spots || []}
          isCheckedList={true}
          onPress={handleSpotChecked}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
      </View>
    </View>
  );
};

export default AddRemoveTagSpots;
