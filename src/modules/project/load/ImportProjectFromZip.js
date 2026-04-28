import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useDevice from '../../../services/device/useDevice';
import {APP_DIRECTORIES} from '../../../services/files/directories.constants';
import {isEmpty} from '../../../shared/helpers';
import * as themes from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import Loading from '../../../shared/ui/Loading';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import {
  addedStatusMessage,
  setIsErrorMessagesModalVisible,
  setIsProjectLoadSelectionModalVisible,
  setStatusMessageModalTitle,
} from '../../home/home.slice';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';

const ImportProjectFromZip = ({goBackToMain, openMainMenuPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);

  const {
    doesBackupFileExist,
    doesDeviceBackupDirExist,
    getExternalProjectData,
    makeDirectory,
    unZipAndCopyImportedData,
  } = useDevice();
  const toast = useToast();

  /* Local State */

  const [importComplete, setIsImportComplete] = useState(false);
  const [importedProject, setImportedProject] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /* Side Effects */

  useEffect(() => {
    console.log('UE MyStraboSpot []');
    checkBackupDir().catch(err => console.error('Error checking for backup dir', err));
    getZippedProject();
  }, []);

  /* Logic Helpers */

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
    if (isEmpty(res)) {
      if (isProjectLoadSelectionModalVisible) goBackToMain();
      else dispatch(setSidePanelVisible({bool: false}));
      toast.show('Nothing was selected.', {type: 'warning'});
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

  /* Render Functions */

  const renderImportComplete = () => {
    return (
      <View>
        <View style={{padding: 10}}>
          <Text style={{textAlign: 'center'}}>
            Project has been saved to the app under MyStraboSpot --&gt; Projects on Device
          </Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <OutlineButton onPress={goToSavedProjects} title={'Go to saved projects'}/>
        </View>
      </View>
    );
  };

  /* View */

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
          <OutlineButton onPress={() => verifyFileExistence('data')} title={'Unzip and Save'}/>
        </View>
      )}
    </View>
  );
};

export default ImportProjectFromZip;
