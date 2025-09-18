import React, {forwardRef, useState} from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from './mainMenu.constants';
import mainMenuPanelStyles from './mainMenuPanel.styles';
import MainMenuPanelHeader from './MainMenuPanelHeader';
import MainMenuPanelList from './MainMenuPanelList';
import DailyNotesPage from '../daily-notes/DailyNotesPage';
import About from '../help/About';
import Documentation from '../help/Documentation';
import IssuesAndReqests from '../help/IssuesAndReqests';
import {ImageGallery} from '../images';
import CustomMapDetails from '../maps/custom-maps/CustomMapDetails';
import ManageCustomMaps from '../maps/custom-maps/ManageCustomMaps';
import ImageBasemapsList from '../maps/ImageBasemapsList';
import ManageOfflineMapsMenu from '../maps/offline-maps/ManageOfflineMaps';
import StratSectionsList from '../maps/strat-section/StratSectionsList';
import MicroProjectsList from '../micro/MicroProjectsList';
import Miscellaneous from '../preferences/Miscellaneous';
import ShortcutMenu from '../preferences/shortcuts-menu/ShortcutsMenu';
import BackupProjectPage from '../project/backup/BackupProjectPage';
import ExportProjectPage from '../project/backup/ExportProjectPage';
import CustomFeatureTypes from '../project/CustomFeatureTypes';
import DatasetDetail from '../project/datasets/DatasetDetail';
import DatasetsPage from '../project/datasets/DatasetsPage';
import DeleteProjectPage from '../project/delete/DeleteProjectPage';
import DownloadProjectPage from '../project/load/DownloadProjectPage';
import ImportProjectFromZip from '../project/load/ImportProjectFromZip';
import NewProjectPage from '../project/load/NewProjectPage';
import OpenProjectPage from '../project/load/OpenProjectPage';
import NamingConventions from '../project/NamingConventions';
import ProjectDescription from '../project/ProjectDescription';
import ProjectPrivacyPage from '../project/ProjectPrivacyPage';
import StraboFieldProjects from '../project/StraboFieldProjects';
import {ReportsMenu} from '../reports';
import SamplesMenuItem from '../samples/SamplesMenuItem';
import {SpotsList} from '../spots';
import {AddRemoveTagFeatures, AddRemoveTagSpots, TagDetailSidePanel, Tags} from '../tags';
import UserConventions from '../user/UserConventions';
import UserProfile from '../user/UserProfile';

const MainMenuPanel = forwardRef(({
                                    closeMainMenuPanel,
                                    openNotebookPanel,
                                    openSpotInNotebook,
                                  }, mapComponentRef) => {
  console.log('Rendering MainMenuPanel...');

  const isSidePanelVisible = useSelector(state => state.mainMenu.isSidePanelVisible);
  const mainMenuPageVisible = useSelector(state => state.mainMenu.mainMenuPageVisible);
  const sidePanelView = useSelector(state => state.mainMenu.sidePanelView);

  const [datasetToView, setDatasetToView] = useState({});

  const renderMainMenuContent = () => {
    return (
      <>
        {!isSidePanelVisible && <MainMenuPanelHeader/>}
        {renderMainMenuList()}
      </>
    );
  };

  const renderMainMenuList = () => {
    switch (mainMenuPageVisible) {
      // Manage Project
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS:
        return <DatasetsPage setDatasetToView={setDatasetToView}/>;
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP:
        return <BackupProjectPage closeMainMenuPanel={closeMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.DESCRIPTION:
        return <ProjectDescription setDatasetToView={setDatasetToView}/>;
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.SETTINGS:
        return <ProjectPrivacyPage/>;

      // Customize & Preset
      case MAIN_MENU_ITEMS.CUSTOMIZE_AND_PRESET.NAMING_CONVENTIONS:
        return <NamingConventions/>;
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
          <SamplesMenuItem
            openSpotInNotebook={openSpotInNotebook}
            updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}
          />
        );
      case MAIN_MENU_ITEMS.PROJECT_DATA.REPORTS:
        return <ReportsMenu/>;
      case MAIN_MENU_ITEMS.PROJECT_DATA.TAGS:
        return <Tags updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}/>;
      case MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS:
        return <Tags type={'geologic_unit'} updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}/>;
      case MAIN_MENU_ITEMS.PROJECT_DATA.STRAT_SECTIONS :
        return <StratSectionsList closeManMenuPanel={closeMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.PROJECT_DATA.DAILY_NOTES:
        return <DailyNotesPage/>;

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
        return <ShortcutMenu/>;
      case MAIN_MENU_ITEMS.APP_SETTINGS.ADVANCED_OPTIONS:
        return <Miscellaneous/>;

      // Help
      case MAIN_MENU_ITEMS.HELP.ABOUT:
        return <About/>;
      case MAIN_MENU_ITEMS.HELP.DOCUMENTATION:
        return <Documentation/>;
      case MAIN_MENU_ITEMS.HELP.ISSUES:
        return <IssuesAndReqests/>;

      default:
        return <MainMenuPanelList/>;
    }
  };

  const renderSidePanelContent = () => {
    switch (sidePanelView) {
      case SIDE_PANEL_VIEWS.DATASET_DETAIL:
        return <DatasetDetail dataset={datasetToView}/>;
      case SIDE_PANEL_VIEWS.DELETE_PROJECT:
        return <DeleteProjectPage/>;
      case SIDE_PANEL_VIEWS.DOWNLOAD_PROJECT:
        return <DownloadProjectPage/>;
      case SIDE_PANEL_VIEWS.EXPORT_PROJECT:
        return <ExportProjectPage/>;
      case SIDE_PANEL_VIEWS.IMPORT_PROJECT:
        return <ImportProjectFromZip/>;
      case SIDE_PANEL_VIEWS.MANAGE_CUSTOM_MAP:
        return <CustomMapDetails/>;
      case SIDE_PANEL_VIEWS.NEW_PROJECT:
        return <NewProjectPage/>;
      case SIDE_PANEL_VIEWS.OPEN_PROJECT:
        return <OpenProjectPage/>;
      case SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_FEATURES:
        return <AddRemoveTagFeatures/>;
      case SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_SPOTS:
        return <AddRemoveTagSpots updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}/>;
      case SIDE_PANEL_VIEWS.TAG_DETAIL:
        return <TagDetailSidePanel openNotebookPanel={openNotebookPanel}/>;
    }
  };

  return (
    <View style={mainMenuPanelStyles.container}>
      {isSidePanelVisible && sidePanelView ? renderSidePanelContent() : renderMainMenuContent()}
    </View>
  );
});

export default MainMenuPanel;
