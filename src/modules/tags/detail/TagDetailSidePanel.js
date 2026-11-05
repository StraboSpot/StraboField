import React, {useContext, useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import TagDetail from './TagDetail';
import TagDetailModal from './TagDetailModal';
import {isEmpty} from '../../../shared/helpers';
import {setActiveModal, setModalValues} from '../../home/home.slice';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from '../../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/side-panel/SidePanelHeader';
import {LeavePageContext} from '../../notebook-panel/LeavePageContext';
import {MODAL_KEYS, PAGE_KEYS} from '../../page/pageKeys.constants';
import {setSelectedAttributes, setSelectedSpot} from '../../spots/spots.slice';

const TagDetailSidePanel = ({openNotebookPanel, openSpotInNotebook}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);
  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  /* Local State */

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  /* Derived Variables */

  const label = selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS
    : MAIN_MENU_ITEMS.PROJECT_DATA.TAGS;

  /* Logic Helpers */

  const closeDetailModal = () => setIsDetailModalVisible(false);

  const openDetailModal = () => setIsDetailModalVisible(true);

  // Selecting the Spot closes the notebook page on screen, so it is asked about first. openNotebookPanel would ask
  // too, but only once the Spot had already been switched.
  const openFeatureDetail = async (spot, feature, featureType) => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    dispatch(setSelectedSpot(spot));
    // The panel opens the page, so the feature is selected after it, the same way openFeatureInNotebook does
    openNotebookPanel(featureType);
    dispatch(setSelectedAttributes([feature]));
  };

  // The memo modal is rendered at the app level off activeModal, so it opens over the panel as it does from the
  // Memos list
  const openReport = (report) => {
    dispatch(setModalValues(report));
    dispatch(setActiveModal({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
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
          addRemoveReports={() => {
            dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_REPORTS}));
          }}
          addRemoveSampleSpots={() => {
            dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_SAMPLE_SPOTS}));
          }}
          addRemoveSpots={() => {
            dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_SPOTS}));
          }}
          openDetailModal={openDetailModal}
          openFeatureDetail={openFeatureDetail}
          openReport={openReport}
          openSpot={async (spot) => {
            if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
            dispatch(setSelectedSpot(spot));
            openNotebookPanel();
          }}
          openSpotInNotebook={openSpotInNotebook}
        />
      </View>

      {/* Modals */}
      {isDetailModalVisible && <TagDetailModal closeModal={closeDetailModal}/>}
    </View>
  );
};

export default TagDetailSidePanel;
