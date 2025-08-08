import React, {forwardRef, useState} from 'react';
import {SafeAreaView} from 'react-native';

import {useSelector} from 'react-redux';

import About from './About';
import Documentation from './Documentation';
import IssuesAndReqests from './IssuesAndReqests';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from './mainMenu.constants';
import mainMenuPanelStyles from './mainMenuPanel.styles';
import MainMenuPanelHeader from './MainMenuPanelHeader';
import MainMenuPanelList from './MainMenuPanelList';
import {isEmpty} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import {ImageGallery} from '../images';
import CustomMapDetails from '../maps/custom-maps/CustomMapDetails';
import ManageCustomMaps from '../maps/custom-maps/ManageCustomMaps';
import ImageBasemapsList from '../maps/ImageBasemapsList';
import ManageOfflineMapsMenu from '../maps/offline-maps/ManageOfflineMaps';
import StratSectionsList from '../maps/strat-section/StratSectionsList';
import MicroProjectsList from '../micro/MicroProjectsList';
import Miscellaneous from '../preferences/Miscellaneous';
import ShortcutMenu from '../preferences/shortcuts-menu/ShortcutsMenu';
import CustomFeatureTypes from '../project/CustomFeatureTypes';
import DailyNotesSection from '../project/daily-notes/DailyNotesSection';
import DatasetDetail from '../project/dataset/DatasetDetail';
import DatasetsPanel from '../project/DatasetsPanel';
import MyStraboSpot from '../project/MyStraboSpot';
import ProjectDescription from '../project/ProjectDescription';
import ProjectSettingsPanel from '../project/ProjectSettingsPanel';
import UploadBackupAndExport from '../project/UploadBackupExport';
import {ReportsMenu} from '../reports';
import SamplesMenuItem from '../samples/SamplesMenuItem';
import {SpotsList} from '../spots';
import {AddRemoveTagFeatures, AddRemoveTagSpots, TagDetailSidePanel, Tags} from '../tags';
import AccountPanel from '../user/AccountPanel';
import UserProfilePage from '../user/UserProfilePage';

const MainMenuPanel = forwardRef(({
                                    closeMainMenuPanel,
                                    openMainMenuPanel,
                                    openNotebookPanel,
                                    openSpotInNotebook,
                                  }, mapComponentRef) => {
  console.log('Rendering MainMenuPanel...');

  const isSidePanelVisible = useSelector(state => state.mainMenu.isSidePanelVisible);
  const project = useSelector(state => state.project.project);
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
        return <DatasetsPanel setDatasetToView={setDatasetToView}/>;
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP:
        return <UploadBackupAndExport closeMainMenuPanel={closeMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.DESCRIPTION:
        return <ProjectDescription setDatasetToView={setDatasetToView}/>;
      case MAIN_MENU_ITEMS.MANAGE_PROJECT.SETTINGS:
        return <ProjectSettingsPanel/>;

      //  Project Data
      case MAIN_MENU_ITEMS.PROJECT_DATA.SPOTS:
        return (
          <SpotsList
            onPress={openSpotInNotebook}
            updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}/>
        );
      case MAIN_MENU_ITEMS.PROJECT_DATA.IMAGES:
        return (
          <ImageGallery
            openSpotInNotebook={openSpotInNotebook}
            updateSpotsInMapExtent={mapComponentRef?.current?.updateSpotsInMapExtent}/>
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
        return <DailyNotesSection/>;
      case MAIN_MENU_ITEMS.PROJECT_DATA.CUSTOM_PRESETS:
        return <CustomFeatureTypes/>;

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

      // My StraboSpot
      case MAIN_MENU_ITEMS.MY_STRABOSPOT.STRABOFIELD_PROJECTS:
        return <MyStraboSpot openMainMenuPanel={openMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.MY_STRABOSPOT.STRABOMICRO_PROJECTS:
        return <MicroProjectsList/>;
      case MAIN_MENU_ITEMS.MY_STRABOSPOT.ACCOUNT:
        return <AccountPanel/>;

      // App Settings, Documentation, Help
      case MAIN_MENU_ITEMS.SETTINGS.MAP_BUTTON_OPTIONS:
        return <ShortcutMenu/>;
      case MAIN_MENU_ITEMS.SETTINGS.APP_SETTINGS:
        return <Miscellaneous/>;
      case MAIN_MENU_ITEMS.SETTINGS.ABOUT:
        return <About/>;
      case MAIN_MENU_ITEMS.SETTINGS.DOCUMENTATION:
        return <Documentation/>;
      case MAIN_MENU_ITEMS.SETTINGS.ISSUES:
        return <IssuesAndReqests/>;
      default:
        return (
          <MainMenuPanelList
            activeProject={!isEmpty(project) && project.description ? project.description.project_name
              : 'No Active Project'}
          />
        );
    }
  };

  const renderSidePanelContent = () => {
    switch (sidePanelView) {
      case SIDE_PANEL_VIEWS.DATASET_DETAIL:
        return <DatasetDetail dataset={datasetToView}/>;
      case SIDE_PANEL_VIEWS.MANAGE_CUSTOM_MAP:
        return <CustomMapDetails/>;
      case SIDE_PANEL_VIEWS.PROJECT_DESCRIPTION:
        return <ProjectDescription/>;
      case SIDE_PANEL_VIEWS.TAG_DETAIL:
        return <TagDetailSidePanel openNotebookPanel={openNotebookPanel}/>;
      case SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_SPOTS:
        return <AddRemoveTagSpots updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}/>;
      case SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_FEATURES:
        return <AddRemoveTagFeatures/>;
      case SIDE_PANEL_VIEWS.USER_PROFILE:
        return <UserProfilePage/>;
    }
  };

  return (
    <SafeAreaView style={[mainMenuPanelStyles.container, SMALL_SCREEN ? {paddingTop: 30} : {}]}>
      {isSidePanelVisible && sidePanelView ? renderSidePanelContent() : renderMainMenuContent()}
    </SafeAreaView>
  );
});

export default MainMenuPanel;
