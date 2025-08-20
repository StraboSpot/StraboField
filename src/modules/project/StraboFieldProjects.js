import React, {useEffect, useState} from 'react';
import {FlatList, Linking, Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {SaveProjectModal, UploadModal, UploadProgressModal} from './modals';
import {APP_DIRECTORIES} from '../../services/directories.constants';
import useDevice from '../../services/useDevice';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {BLUE} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import uiStyles from '../../shared/ui/ui.styles';
import overlayStyles from '../home/overlays/overlay.styles';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import LogOut from '../user/LogOut';

const StraboFieldProjects = () => {
  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
  const [isSaveProjectModalVisible, setIsSaveProjectModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  const {doesDeviceBackupDirExist, openURL, makeDirectory} = useDevice();

  const importLocation = Platform.OS === 'ios' ? 'Documents/Strabofield/Distribution'
    : 'Downloads/StraboSpot2/Backups';

  useEffect(() => {
    console.log('UE MyStraboSpot []');
    if (Platform.OS !== 'web') checkBackupDir().catch(err => console.error('Error checking for backup dir', err));
  }, []);

  const checkAndroidDownloadDir = async () => {
    const exists = await doesDeviceBackupDirExist(undefined, true);
    if (!exists) await makeDirectory(APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID);
  };

  const checkBackupDir = async () => {
    try {
      const exists = await doesDeviceBackupDirExist();
      console.log('Backup Directory Exists: ', exists);
      if (Platform.OS === 'android') await checkAndroidDownloadDir();
      console.log('Done Checking Backup Directory');
    }
    catch (err) {
      console.error('Error Checking If Backup Dir Exists', err);
    }
  };

  const onDeleteLocalCopy = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.DELETE_LOCAL_PROJECT_COPY}));
  };

  const onStartNewProject = () => {
    dispatch(setSidePanelVisible({view: SIDE_PANEL_VIEWS.NEW_PROJECT, bool: true}));
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
          <View>
            <Button
              title={'Start a New Project'}
              containerStyle={commonStyles.standardButtonContainer}
              buttonStyle={commonStyles.standardButton}
              titleStyle={commonStyles.standardButtonText}
              onPress={onStartNewProject}
            />
            <Button
              title={'Open Local Copy'}
              containerStyle={commonStyles.standardButtonContainer}
              buttonStyle={commonStyles.standardButton}
              titleStyle={commonStyles.standardButtonText}
              onPress={onLoadProjectsFromDevice}
            />
            {Platform.OS === 'ios'
              && (
                <View style={{padding: 10}}>
                  <Text style={{...overlayStyles.statusMessageText}}>After backing up,
                    to further preserve your data please copy your project backups out of the StraboSpot2/ProjectBackups
                    folder to a
                    different folder in the iOS app Files/On My IPad! If online, you can find detailed instructions
                    <Text style={{color: BLUE}} onPress={openMovingProjectBackupsURL}> here</Text>.
                  </Text>
                </View>
              )
            }
            {isEmpty(user.name) && (
              <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>
                Please Log In.
              </Text>
            )}
            {!isEmpty(user.name) && isOnline.isConnected && (
              <Button
                title={'Download Project'}
                containerStyle={commonStyles.standardButtonContainer}
                buttonStyle={commonStyles.standardButton}
                titleStyle={commonStyles.standardButtonText}
                onPress={onLoadProjectsFromServer}
              />
            )}
            {!isEmpty(user.name) && !isOnline.isConnected && (
              <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>
                Please connect to the Internet.
              </Text>
            )}
            <Button
              title={'Import Project from Zip'}
              containerStyle={commonStyles.standardButtonContainer}
              buttonStyle={commonStyles.standardButton}
              titleStyle={commonStyles.standardButtonText}
              onPress={onLoadProjectsFromDownloadsFolder}
            />
            {Platform.OS === 'ios' && (
              <View style={{flex: 1, justifyContent: 'flex-end', paddingBottom: 15}}>
                <View style={{padding: 10, alignItems: 'center'}}>
                  <Text style={{...uiStyles.sectionDividerText, textAlign: 'center'}}>
                    Additional help documents can be found in the Menu -&gt; Help -&gt; Documentation
                  </Text>
                </View>
                <Button
                  title={'View/Edit Files on Device'}
                  type={'outline'}
                  containerStyle={commonStyles.buttonPadding}
                  buttonStyle={commonStyles.standardButton}
                  titleStyle={commonStyles.standardButtonText}
                  onPress={() => openURL('ProjectBackups')}
                  iconContainerStyle={{paddingRight: 10}}
                  icon={{
                    name: 'file-tray-full-outline',
                    type: 'ionicon',
                    color: BLUE,
                  }}
                />
              </View>
            )}
            {Platform.OS === 'android' && (
              <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>
                *The imported project should only be a .zip file in the {importLocation} folder.
              </Text>
            )}
            <Button
              title={'Delete Local Copy'}
              containerStyle={commonStyles.standardButtonContainer}
              buttonStyle={commonStyles.standardButton}
              titleStyle={commonStyles.standardButtonText}
              onPress={onDeleteProject}
            />
          </View>
        }
      />
      {Platform.OS !== 'web' && <LogOut/>}

      {/*  Modals */}
      {isSaveProjectModalVisible && (
        <SaveProjectModal
          visible={isSaveProjectModalVisible}
          closeModal={() => setIsSaveProjectModalVisible(false)}
        />
      )}
      <UploadModal
        visible={isUploadModalVisible}
        closeModal={() => setIsUploadModalVisible(false)}
      />
      <UploadProgressModal
        isProgressModalVisible={isProgressModalVisible}
      />
    </>
  );
};

export default StraboFieldProjects;
