import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from '../../../services/directories.constants';
import useDevice from '../../../services/useDevice';
import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import Loading from '../../../shared/ui/Loading';
import {
  addedStatusMessage,
  setIsErrorMessagesModalVisible,
  setIsProjectLoadSelectionModalVisible,
  setStatusMessageModalTitle,
} from '../../home/home.slice';
import overlayStyles from '../../home/overlays/overlay.styles';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';

const ImportProjectFromZip = ({goBackToMain, openMainMenuPanel}) => {
  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);

  const [importComplete, setIsImportComplete] = useState(false);
  const [importedProject, setImportedProject] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const {
    doesBackupFileExist,
    doesDeviceBackupDirExist,
    getExternalProjectData,
    makeDirectory,
    unZipAndCopyImportedData,
  } = useDevice();

  useEffect(() => {
    console.log('UE MyStraboSpot []');
    checkBackupDir().catch(err => console.error('Error checking for backup dir', err));
    getZippedProject();
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

  const getZippedProject = async () => {
    const res = await getExternalProjectData();
    console.log('EXTERNAL PROJECT', res);
    if (isEmpty(res)) {
      if (isProjectLoadSelectionModalVisible) goBackToMain();
      else dispatch(setSidePanelVisible({bool: false}));
    }
    else setImportedProject(res);
  };

  const goToSavedProjects = () => {
    if (isProjectLoadSelectionModalVisible) {
      dispatch(setIsProjectLoadSelectionModalVisible(false));
      openMainMenuPanel();
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.ACCOUNT.STRABOFIELD_PROJECTS}));
    }
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.OPEN_PROJECT}));
  };

  const renderImportComplete = () => {
    return (
      <View>
        <View style={{padding: 10}}>
          <Text style={{textAlign: 'center'}}>
            Project has been saved to the app under MyStraboSpot --&gt; Projects on Device
          </Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <Button
            containerStyle={{alignItems: 'flex-start'}}
            onPress={goToSavedProjects}
            title={'Go to saved projects'}
            titleStyle={commonStyles.standardButtonText}
            type={'clear'}
          />
        </View>
      </View>
    );
  };

  const saveToDevice = async () => {
    try {
      setIsLoading(true);
      dispatch(setStatusMessageModalTitle('Importing Project...'));
      await unZipAndCopyImportedData(importedProject);
      setIsImportComplete(true);
      dispatch(setStatusMessageModalTitle('Project Imported'));
      setIsLoading(false);
    }
    catch (err) {
      console.error('Error Writing Project Data', err);
      dispatch(setIsErrorMessagesModalVisible(true));
      dispatch(addedStatusMessage(err.toString()));
      setIsImportComplete(false);
      setIsLoading(false);
      throw Error();
    }
  };

  const verifyFileExistence = async (dataType) => {
    if (dataType === 'data') {
      const fileName = importedProject.name.replace('.zip', '');
      const fileExists = await doesBackupFileExist(fileName);
      if (fileExists) {
        console.log('File already exits!');
        alert('File Exists', 'A file with the name ' + fileName + ' exists already.  Saving'
          + ' this will overwrite the current one.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Continue',
              onPress: () => saveToDevice(),
              style: 'cancel',
            },
          ]);
      }
      else {
        await makeDirectory(APP_DIRECTORIES.BACKUP_DIR + fileName);
        await saveToDevice();
      }
    }
  };

  return (
    <View style={{flex: 1}}>
      {!isProjectLoadSelectionModalVisible && (
        <SidePanelHeader
          backButton={() => dispatch(setSidePanelVisible({bool: false}))}
          headerTitle={'Import Project'}
          title={'StraboField Projects'}
        />
      )}

      {importComplete ? renderImportComplete() : isLoading ? (
        <View style={{flex: 1}}>
          <Loading
            isLoading={isLoading}
            style={{backgroundColor: themes.PRIMARY_BACKGROUND_COLOR}}
          />
        </View>
      ) : (
        <View style={{alignItems: 'center', padding: 10}}>
          <Text style={overlayStyles.contentText}>
            <Text style={{fontWeight: 'bold'}}>Selected Project to Import:{'\n'}{'\n'}</Text>
            {importedProject.name}
          </Text>
          <Button
            containerStyle={{marginTop: 20}}
            onPress={() => verifyFileExistence('data')}
            title={'Unzip and Save'}
            type={'clear'}
          />
        </View>
      )}
    </View>
  );
};

export default ImportProjectFromZip;
