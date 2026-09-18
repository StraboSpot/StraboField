import React from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import useTags from './useTags';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/side-panel/SidePanelHeader';
import SpotsList from '../spots/SpotsList';

const AddRemoveTagSpots = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);

  const {addRemoveSpotFromTag} = useTags();

  /* Event Handlers */

  const handleSpotChecked = spot => addRemoveSpotFromTag(spot.properties.id, selectedTag);

  /* Logic Helpers */

  const openDatasetsPage = () => {
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
  };

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
          openDatasetsPage={openDatasetsPage}
        />
      </View>
    </View>
  );
};

export default AddRemoveTagSpots;
