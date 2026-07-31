import React from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import useDevice from '../../services/device/useDevice';
import {isEmpty} from '../../shared/helpers';
import {BLUE} from '../../shared/styles.constants';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../shared/ui/SectionDivider';
import Spacer from '../../shared/ui/Spacer';
import ConnectionRequiredMessage from '../../shared/ui/text/ConnectionRequiredMessage';
import useIsConnectionAvailable from '../connections/useConnectionStatus';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import MainMenuPanelListItem from '../main-menu-panel/MainMenuPanelListItem';
import LogOut from '../user/LogOut';

const importLocationText = Platform.OS === 'ios' ? 'Documents/Strabofield/Distribution'
  : 'Downloads/StraboSpot2/Backups';

const StraboFieldProjects = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const user = useSelector(state => state.user);

  const isConnectionAvailable = useIsConnectionAvailable();
  const {openURL} = useDevice();

  /* Event Handlers */

  const onDeleteLocalCopy = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.DELETE_PROJECT}));
  };

  const onExportOtherSavedProject = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.EXPORT_PROJECT}));
  };

  const onLoadProjectsFromDevice = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.OPEN_PROJECT}));
  };

  const onLoadProjectsFromDownloadsFolder = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.IMPORT_PROJECT}));
  };

  const onLoadProjectsFromServer = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.DOWNLOAD_PROJECT}));
  };

  const onStartNewProject = () => dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.NEW_PROJECT}));

  /* View */

  return (
    <>
      <FlatList
        ListHeaderComponent={
          <>
            <SectionDivider dividerText={'Load a Project'}/>
            {!isEmpty(user.name) && !isConnectionAvailable && (
              <ConnectionRequiredMessage actionText={'download a project'}/>
            )}
            <MainMenuPanelListItem onPress={onStartNewProject} title={'New'}/>
            <FlatListItemSeparator/>
            {!isEmpty(user.name) && isConnectionAvailable && (
              <>
                <MainMenuPanelListItem onPress={onLoadProjectsFromServer} title={'Download'}/>
                <FlatListItemSeparator/>
              </>
            )}
            <MainMenuPanelListItem onPress={onLoadProjectsFromDevice} title={'Open'}/>
            <FlatListItemSeparator/>
            <MainMenuPanelListItem onPress={onLoadProjectsFromDownloadsFolder} title={'Import'}/>
            {Platform.OS === 'android' && (
              <Text style={overlayStyles.statusMessageText}>
                *The imported project must be a StraboField .zip file in the {importLocationText} folder.
              </Text>
            )}
            <Spacer/>
            <SectionDivider dividerText={'Other Project Actions'}/>
            <Text style={overlayStyles.statusMessageText}>
              Affects locally saved projects only. {'\n'}Current project stays unchanged.
            </Text>
            <MainMenuPanelListItem onPress={onDeleteLocalCopy} title={'Delete'}/>
            <FlatListItemSeparator/>
            <MainMenuPanelListItem
              onPress={onExportOtherSavedProject}
              title={Platform.OS === 'ios' ? 'Zip' : 'Export to Zip'}
            />
            {Platform.OS === 'ios' && (
              <View style={{flex: 1, justifyContent: 'flex-end', paddingBottom: 15}}>
                <OutlineButton
                  icon={{
                    name: 'file-tray-full-outline',
                    type: 'ionicon',
                    color: BLUE,
                  }}
                  onPress={() => openURL('ProjectBackups')}
                  title={'View/Edit Files on Device'}
                />
              </View>
            )}
          </>
        }
      />
      <LogOut/>
    </>
  );
};

export default StraboFieldProjects;
