import React, {forwardRef, useEffect, useState} from 'react';
import {KeyboardAvoidingView, Platform, View} from 'react-native';

import {useSelector} from 'react-redux';

import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from './mainMenu.constants';
import mainMenuPanelStyles from './mainMenuPanel.styles';
import MainMenuPanelHeader from './MainMenuPanelHeader';
import MainMenuPanelList from './MainMenuPanelList';
import DailyNotes from '../daily-notes/DailyNotes';
import About from '../help/about/About';
import Documentation from '../help/documentation/Documentation';
import IssuesAndRequests from '../help/issues-and-requests/IssuesAndRequests';
import {ImageGallery} from '../images';
import MenuSearch from './MenuSearch';
import CustomMapDetails from '../maps/custom-maps/CustomMapDetails';
import ManageCustomMaps from '../maps/custom-maps/ManageCustomMaps';
import ImageBasemapsList from '../maps/ImageBasemapsList';
import ManageOfflineMapsMenu from '../maps/offline-maps/ManageOfflineMaps';
import StratSectionsList from '../maps/strat-section/StratSectionsList';
import MicroProjectsList from '../micro/MicroProjectsList';
import AddingNewSpots from '../preferences/AddingNewSpots';
import Miscellaneous from '../preferences/Miscellaneous';
import BackupProject from '../project/backup/BackupProject';
import ExportProject from '../project/backup/ExportProject';
import CustomFeatureTypes from '../project/CustomFeatureTypes';
import Datasets from '../project/datasets/Datasets';
import DeleteProject from '../project/delete/DeleteProject';
import Governance from '../project/governance/Governance';
import DownloadProject from '../project/load/DownloadProject';
import ImportProjectFromZip from '../project/load/ImportProjectFromZip';
import NewProject from '../project/load/NewProject';
import OpenProject from '../project/load/OpenProject';
import NamingConventions from '../project/NamingConventions';
import ProjectDescription from '../project/ProjectDescription';
import StraboFieldProjects from '../project/StraboFieldProjects';
import {ReportsMenu} from '../reports';
import Samples from '../samples/Samples';
import {SpotsList} from '../spots';
import {AddRemoveTagFeatures, AddRemoveTagSpots, TagDetailSidePanel, Tags} from '../tags';
import Templates from '../templates/Templates';
import UserConventions from '../user/UserConventions';
import UserProfile from '../user/UserProfile';

const MainMenuPanel = forwardRef(({
                                    closeMainMenuPanel,
                                    closeNotebookPanel,
                                    navigation,
                                    openNotebookPanel,
                                    openSpotInNotebook,
                                  }, mapComponentRef) => {
  console.log('Rendering MainMenuPanel...');

  /* Data Hooks */

  const isSidePanelVisible = useSelector(state => state.mainMenu.isSidePanelVisible);
  const mainMenuPageVisible = useSelector(state => state.mainMenu.mainMenuPageVisible);
  const sidePanelView = useSelector(state => state.mainMenu.sidePanelView);

  /* Local State */

  const [isTagsOverflowMenuVisible, setIsTagsOverflowMenuVisible] = useState(false);
  const [searchState, setSearchState] = useState('');

  /* Derived Variables */

  const isTagsPage = mainMenuPageVisible === MAIN_MENU_ITEMS.PROJECT_DATA.TAGS
    || mainMenuPageVisible === MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS;

  /* Side Effects */

  useEffect(() => {
    setSearchState('');
    setIsTagsOverflowMenuVisible(false);
  }, [mainMenuPageVisible]);

  /* Render Functions */

  const renderMainMenuContent = () => {
    return (
      <>
        {!isSidePanelVisible
          && (!mainMenuPageVisible
            || (mainMenuPageVisible && mainMenuPageVisible !== MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS
              && mainMenuPageVisible !== MAIN_MENU_ITEMS.CUSTOMIZE_AND_PRESET.TEMPLATES))
          && <MainMenuPanelHeader onTagsOverflowMenuPress={isTagsPage && (() => setIsTagsOverflowMenuVisible(true))}/>
        }
        {renderMainMenuList()}
      </>
    );
  };

  const renderMainMenuList = () => {
    switch (mainMenuPageVisible) {
      // Manage Project
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS:
        return <Datasets/>;
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP:
        return <BackupProject closeMainMenuPanel={closeMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.DESCRIPTION:
        return <ProjectDescription/>;
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.SETTINGS:
        return <Governance/>;

      // Customize & Preset
      case MAIN_MENU_ITEMS.CUSTOMIZE_AND_PRESET.NAMING_CONVENTIONS:
        return <NamingConventions/>;
      case MAIN_MENU_ITEMS.CUSTOMIZE_AND_PRESET.TEMPLATES:
        return <Templates/>;
      case MAIN_MENU_ITEMS.CUSTOMIZE_AND_PRESET.CUSTOM_FEATURE_TYPES:
        return <CustomFeatureTypes/>;

      //  Project Data
      case MAIN_MENU_ITEMS.PROJECT_DATA.SPOTS:
        return (
          <SpotsList
            onPress={openSpotInNotebook}
            updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}
          />
        );
      case MAIN_MENU_ITEMS.PROJECT_DATA.IMAGES:
        return (
          <ImageGallery
            openSpotInNotebook={openSpotInNotebook}
            updateSpotsInMapExtent={mapComponentRef?.current?.updateSpotsInMapExtent}
          />
        );
      case MAIN_MENU_ITEMS.PROJECT_DATA.SAMPLES:
        return (
          <Samples
            openSpotInNotebook={openSpotInNotebook}
            updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}
          />
        );
      case MAIN_MENU_ITEMS.PROJECT_DATA.REPORTS:
        return <ReportsMenu/>;
      case MAIN_MENU_ITEMS.PROJECT_DATA.TAGS:
        return (
          <Tags
            closeTagsOverflowMenu={() => setIsTagsOverflowMenuVisible(false)}
            isOverflowMenuVisible={isTagsOverflowMenuVisible}
            updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}
          />
        );
      case MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS:
        return (
          <Tags
            closeTagsOverflowMenu={() => setIsTagsOverflowMenuVisible(false)}
            isGeologicUnits
            isOverflowMenuVisible={isTagsOverflowMenuVisible}
            updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}
          />
        );
      case MAIN_MENU_ITEMS.PROJECT_DATA.STRAT_SECTIONS :
        return <StratSectionsList closeManMenuPanel={closeMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.PROJECT_DATA.DAILY_NOTES:
        return <DailyNotes/>;

      // Maps
      case MAIN_MENU_ITEMS.MAPS.CUSTOM:
        return <ManageCustomMaps zoomToCustomMap={mapComponentRef.current?.zoomToCustomMap}/>;
      case MAIN_MENU_ITEMS.MAPS.IMAGE_BASEMAPS :
        return <ImageBasemapsList closeManMenuPanel={closeMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.MAPS.MANAGE_OFFLINE_MAPS:
        return (
          <ManageOfflineMapsMenu
            closeMainMenuPanel={closeMainMenuPanel}
            zoomToCenterOfflineTile={mapComponentRef.current?.zoomToCenterOfflineTile}
          />
        );

      // Account
      case MAIN_MENU_ITEMS.ACCOUNT.PROFILE:
        return <UserProfile/>;
      case MAIN_MENU_ITEMS.ACCOUNT.STRABOFIELD_PROJECTS:
        return <StraboFieldProjects/>;
      case MAIN_MENU_ITEMS.ACCOUNT.STRABOMICRO_PROJECTS:
        return <MicroProjectsList/>;
      case MAIN_MENU_ITEMS.ACCOUNT.USER_CONVENTIONS:
        return <UserConventions/>;

      // App Settings
      case MAIN_MENU_ITEMS.APP_SETTINGS.ADDING_NEW_SPOTS:
        return <AddingNewSpots/>;
      case MAIN_MENU_ITEMS.APP_SETTINGS.ADVANCED_OPTIONS:
        return <Miscellaneous/>;

      // Help
      case MAIN_MENU_ITEMS.HELP.ABOUT:
        return <About/>;
      case MAIN_MENU_ITEMS.HELP.DOCUMENTATION:
        return <Documentation navigation={navigation}/>;
      case MAIN_MENU_ITEMS.HELP.ISSUES:
        return <IssuesAndRequests/>;

      default:
        return (
          <>
            <MenuSearch searchState={searchState} setSearchState={setSearchState}/>
            <MainMenuPanelList searchText={searchState}/>
          </>
        );
    }
  };

  const renderSidePanelContent = () => {
    switch (sidePanelView) {
      case SIDE_PANEL_VIEWS.DELETE_PROJECT:
        return <DeleteProject/>;
      case SIDE_PANEL_VIEWS.DOWNLOAD_PROJECT:
        return <DownloadProject closeMainMenuPanel={closeMainMenuPanel} closeNotebookPanel={closeNotebookPanel}/>;
      case SIDE_PANEL_VIEWS.EXPORT_PROJECT:
        return <ExportProject/>;
      case SIDE_PANEL_VIEWS.IMPORT_PROJECT:
        return <ImportProjectFromZip/>;
      case SIDE_PANEL_VIEWS.MANAGE_CUSTOM_MAP:
        return <CustomMapDetails/>;
      case SIDE_PANEL_VIEWS.NEW_PROJECT:
        return <NewProject closeNotebookPanel={closeNotebookPanel}/>;
      case SIDE_PANEL_VIEWS.OPEN_PROJECT:
        return <OpenProject closeMainMenuPanel={closeMainMenuPanel} closeNotebookPanel={closeNotebookPanel}/>;
      case SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_FEATURES:
        return <AddRemoveTagFeatures/>;
      case SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_SPOTS:
        return <AddRemoveTagSpots updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}/>;
      case SIDE_PANEL_VIEWS.TAG_DETAIL:
        return <TagDetailSidePanel openNotebookPanel={openNotebookPanel}/>;
    }
  };

  /* View */

  return (
    <View style={mainMenuPanelStyles.container}>
      <KeyboardAvoidingView
        behavior={'padding'}
        enabled={Platform.OS === 'ios'}
        style={{flex: 1}}
      >
        {isSidePanelVisible && sidePanelView ? renderSidePanelContent() : renderMainMenuContent()}
      </KeyboardAvoidingView>
    </View>
  );
});

export default MainMenuPanel;
