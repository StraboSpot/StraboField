import React, {useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../shared/Helpers';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedAttributes, setSelectedSpot} from '../spots/spots.slice';
import {TagDetail, TagDetailModal} from '../tags';

const TagDetailSidePanel = ({openNotebookPanel, openSpotInNotebook}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);

  /* Local State */

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  /* Derived Variables */

  const label = selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS
    : MAIN_MENU_ITEMS.PROJECT_DATA.TAGS;

  /* Logic Helpers */

  const closeDetailModal = () => setIsDetailModalVisible(false);

  const openFeatureDetail = (spot, feature, featureType) => {
    dispatch(setSelectedSpot(spot));
    dispatch(setSelectedAttributes([feature]));
    openNotebookPanel(featureType);
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <SidePanelHeader
        backButton={() => dispatch(setSidePanelVisible({bool: false}))}
        headerTitle={!isEmpty(selectedTag) && selectedTag.name}
        title={label}
      />

      <View style={{flex: 1}}>
        <TagDetail
          addRemoveFeatures={() => {
            dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_FEATURES}));
          }}
          addRemoveSampleSpots={() => {
            dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_SAMPLE_SPOTS}));
          }}
          addRemoveSpots={() => {
            dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_SPOTS}));
          }}
          openFeatureDetail={(spot, feature, featureType) => openFeatureDetail(spot, feature, featureType)}
          openSpot={(spot) => {
            dispatch(setSelectedSpot(spot));
            openNotebookPanel();
          }}
          openSpotInNotebook={openSpotInNotebook}
          setIsDetailModalVisible={() => setIsDetailModalVisible(true)}
        />
      </View>

      {/* Modals */}
      {isDetailModalVisible && <TagDetailModal closeModal={closeDetailModal}/>}
    </View>
  );
};

export default TagDetailSidePanel;
