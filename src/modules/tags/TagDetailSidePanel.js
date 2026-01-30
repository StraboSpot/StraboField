import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import ColorPickerModal from '../../shared/ColorPickerModal';
import {isEmpty} from '../../shared/Helpers';
import {SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';
import {PAGE_KEYS} from '../page/page.constants';
import {setSelectedAttributes, setSelectedSpot} from '../spots/spots.slice';
import {TagDetail, TagDetailModal} from '../tags';

const TagDetailSidePanel = ({openNotebookPanel, openSpotInNotebook}) => {

  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);

  const [isColorPickerModalVisible, setIsColorPickerModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const label = selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS
    : MAIN_MENU_ITEMS.PROJECT_DATA.TAGS;
  const colorLabel = label === MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS ? 'Unit' : label.slice(0, -1);

  const closeDetailModal = () => setIsDetailModalVisible(false);

  const openFeatureDetail = (spot, feature, featureType) => {
    dispatch(setSelectedSpot(spot));
    dispatch(setSelectedAttributes([feature]));
    openNotebookPanel(featureType);
  };

  return (
    <View style={{flex: 1}}>
      <View style={{flexDirection: 'row'}}>
        <View style={{flex: 1}}>
          <SidePanelHeader
            backButton={() => dispatch(setSidePanelVisible({bool: false}))}
            headerTitle={!isEmpty(selectedTag) && selectedTag.name}
            title={label}
          />
        </View>
        <View style={{width: 100, position: 'absolute', right: 0, top: 0, alignItems: 'center'}}>
          <Text style={{paddingBottom: 5, paddingTop: 5, fontSize: SMALL_TEXT_SIZE}}>{colorLabel} Color</Text>
          <Icon
            color={selectedTag.color}
            containerStyle={{borderWidth: 1}}
            name={selectedTag.color ? 'square' : 'x-square'}
            onPress={() => setIsColorPickerModalVisible(true)}
            size={30}
            type={selectedTag.color ? 'ionicon' : 'feather'}
          />
        </View>
      </View>

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
      {isDetailModalVisible && <TagDetailModal closeModal={closeDetailModal}/>}
      {isColorPickerModalVisible && <ColorPickerModal closeModal={() => setIsColorPickerModalVisible(false)}/>}
    </View>
  );
};

export default TagDetailSidePanel;
