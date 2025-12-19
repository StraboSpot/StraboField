import React from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';
import Samples from '../samples/Samples';
import {useTags} from '../tags';

const AddRemoveTagSampleSpots = ({updateSpotsInMapExtent}) => {
  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);

  const {addRemoveSpotFromTag} = useTags();

  const handleSpotChecked = spot => addRemoveSpotFromTag(spot.properties.id, selectedTag);

  return (
    <View style={{flex: 1}}>
      <SidePanelHeader
        backButton={() => dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_DETAIL}))}
        headerTitle={!isEmpty(selectedTag) && `Add/Remove ${selectedTag.name}`}
        title={`${selectedTag.name}`}
      />
      <View style={{...commonStyles.buttonContainer, flex: 1}}>
        <Samples
          checkedItems={selectedTag?.spots || []}
          handleSpotChecked={handleSpotChecked}
          isCheckedList
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
      </View>
    </View>
  );
};

export default AddRemoveTagSampleSpots;
