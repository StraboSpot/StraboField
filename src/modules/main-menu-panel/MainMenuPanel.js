import React from 'react';
import {SafeAreaView} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useSelector} from 'react-redux';

import About from './About';
import Documentation from './Documentation';
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
import Miscellaneous from '../preferences/Miscellaneous';
import NamingConventions from '../preferences/naming-conventions/NamingConventions';
import ShortcutMenu from '../preferences/shortcuts-menu/ShortcutsMenu';
import ActiveProject from '../project/ActiveProjectPanel';
import MyStraboSpot from '../project/MyStraboSpot';
import ProjectDescription from '../project/ProjectDescription';
import UploadBackupAndExport from '../project/UploadBackupExport';
import SamplesMenuItem from '../samples/SamplesMenuItem';
import {SpotsList} from '../spots';
import {AddRemoveTagFeatures, AddRemoveTagSpots, TagDetailSidePanel, Tags} from '../tags';
import UserProfilePage from '../user/UserProfilePage';

const MainMenuPanel = ({
                         closeMainMenuPanel,
                         logout,
                         openMainMenuPanel,
                         openNotebookPanel,
                         openSpotInNotebook,
                         updateSpotsInMapExtent,
                         zoomToCenterOfflineTile,
                         zoomToCustomMap,
                       }) => {
  console.log('Rendering MainMenuPanel...');

  const isSidePanelVisible = useSelector(state => state.mainMenu.isSidePanelVisible);
  const project = useSelector(state => state.project.project);
  const settingsPageVisible = useSelector(state => state.mainMenu.mainMenuPageVisible);
  const sidePanelView = useSelector(state => state.mainMenu.sidePanelView);

  const toast = useToast();

  const renderMainMenuContent = () => {
    return (
      <>
        <MainMenuPanelHeader/>
        {renderMainMenuList()}
      </>
    );
  };

  const renderMainMenuList = () => {
    switch (settingsPageVisible) {
      case MAIN_MENU_ITEMS.MANAGE.MY_STRABOSPOT:
        return <MyStraboSpot logout={logout} openMainMenuPanel={openMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.MANAGE.ACTIVE_PROJECTS:
        return (
          <ActiveProject
            title={!isEmpty(project) && project.description ? project.description.project_name : 'Un-named'}
          />
        );
      case MAIN_MENU_ITEMS.MANAGE.UPLOAD_BACKUP_EXPORT:
        return <UploadBackupAndExport closeMainMenuPanel={closeMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.ATTRIBUTES.SPOTS_LIST:
        return <SpotsList onPress={openSpotInNotebook} updateSpotsInMapExtent={updateSpotsInMapExtent}/>;
      case MAIN_MENU_ITEMS.ATTRIBUTES.IMAGE_GALLERY:
        return <ImageGallery openSpotInNotebook={openSpotInNotebook} updateSpotsInMapExtent={updateSpotsInMapExtent}/>;
      case MAIN_MENU_ITEMS.ATTRIBUTES.SAMPLES:
        return (
          <SamplesMenuItem
            openSpotInNotebook={openSpotInNotebook}
            updateSpotsInMapExtent={updateSpotsInMapExtent}
          />
        );
      case MAIN_MENU_ITEMS.ATTRIBUTES.GEOLOGIC_UNITS:
        return <Tags type={'geologic_unit'}/>;
      case MAIN_MENU_ITEMS.ATTRIBUTES.TAGS:
        return <Tags/>;
      case MAIN_MENU_ITEMS.MAPS.CUSTOM:
        return <ManageCustomMaps zoomToCustomMap={zoomToCustomMap}/>;
      case MAIN_MENU_ITEMS.MAPS.IMAGE_BASEMAPS :
        return <ImageBasemapsList closeManMenuPanel={closeMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.MAPS.STRAT_SECTIONS :
        return <StratSectionsList closeManMenuPanel={closeMainMenuPanel}/>;
      case MAIN_MENU_ITEMS.MAPS.MANAGE_OFFLINE_MAPS:
        return (
          <ManageOfflineMapsMenu
            closeMainMenuPanel={closeMainMenuPanel}
            zoomToCenterOfflineTile={zoomToCenterOfflineTile}
          />
        );
      case MAIN_MENU_ITEMS.PREFERENCES.SHORTCUTS:
        return <ShortcutMenu/>;
      case MAIN_MENU_ITEMS.PREFERENCES.NAMING_CONVENTIONS:
        return <NamingConventions/>;
      case MAIN_MENU_ITEMS.PREFERENCES.MISCELLANEOUS:
        return <Miscellaneous/>;
      case MAIN_MENU_ITEMS.HELP.ABOUT:
        return <About/>;
      case MAIN_MENU_ITEMS.HELP.DOCUMENTATION:
        return <Documentation/>;
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
      case SIDE_PANEL_VIEWS.MANAGE_CUSTOM_MAP:
        return <CustomMapDetails/>;
      case SIDE_PANEL_VIEWS.PROJECT_DESCRIPTION:
        return <ProjectDescription toastMessage={(message, type) => toast.show(message, {type: type})}/>;
      case SIDE_PANEL_VIEWS.TAG_DETAIL:
        return <TagDetailSidePanel openNotebookPanel={openNotebookPanel}/>;
      case SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_SPOTS:
        return <AddRemoveTagSpots updateSpotsInMapExtent={updateSpotsInMapExtent}/>;
      case SIDE_PANEL_VIEWS.TAG_ADD_REMOVE_FEATURES:
        return <AddRemoveTagFeatures/>;
      case SIDE_PANEL_VIEWS.USER_PROFILE:
        return <UserProfilePage/>;
    }
  };

  return (
    <SafeAreaView style={[mainMenuPanelStyles.container, SMALL_SCREEN ? {paddingTop: 30} : {}]}>
      {isSidePanelVisible ? renderSidePanelContent() : renderMainMenuContent()}
    </SafeAreaView>
  );
};

export default MainMenuPanel;
