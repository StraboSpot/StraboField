import React from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import useDevice from '../../services/useDevice';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {BLUE} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../shared/ui/SectionDivider';
import Spacer from '../../shared/ui/Spacer';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import MainMenuPanelListItem from '../main-menu-panel/MainMenuPanelListItem';
import LogOut from '../user/LogOut';

const StraboFieldProjects = () => {
  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);
  const {openURL} = useDevice();

  const importLocationText = Platform.OS === 'ios' ? 'Documents/Strabofield/Distribution'
    : 'Downloads/StraboSpot2/Backups';

  const onDeleteLocalCopy = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.DELETE_PROJECT}));
  };

  const onExportOtherSavedProject = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.EXPORT_PROJECT}));
  };

  const onLoadProjectsFromServer = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.DOWNLOAD_PROJECT}));
  };

  const onLoadProjectsFromDevice = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.OPEN_PROJECT}));
  };

  const onLoadProjectsFromDownloadsFolder = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.IMPORT_PROJECT}));
  };

  const onStartNewProject = () => dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.NEW_PROJECT}));

  return (
    <>
      <FlatList
        ListHeaderComponent={
          <>
            <SectionDivider dividerText={'Load a Project'}/>
            <MainMenuPanelListItem onPress={onStartNewProject} title={'New'}/>
            <FlatListItemSeparator/>
            {!isEmpty(user.name) && isOnline.isConnected && (
              <>
                <MainMenuPanelListItem onPress={onLoadProjectsFromServer} title={'Download'}/>
                <FlatListItemSeparator/>
              </>
            )}
            <MainMenuPanelListItem onPress={onLoadProjectsFromDevice} title={'Open'}/>
            {!isEmpty(user.name) && !isOnline.isConnected && (
              <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>
                Please connect to the Internet.
              </Text>
            )}
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
                <Button
                  buttonStyle={commonStyles.standardButton}
                  containerStyle={commonStyles.buttonPadding}
                  icon={{
                    name: 'file-tray-full-outline',
                    type: 'ionicon',
                    color: BLUE,
                  }}
                  iconContainerStyle={{paddingRight: 10}}
                  onPress={() => openURL('ProjectBackups')}
                  title={'View/Edit Files on Device'}
                  titleStyle={commonStyles.standardButtonText}
                  type={'outline'}
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
