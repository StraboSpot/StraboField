import React, {useEffect, useState} from 'react';
import {Platform, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import ActiveProjectList from './ActiveProjectList';
import ImportProjectFromZip from './ImportProjectFromZip';
import NewProjectForm from './NewProjectForm';
import ProjectList from './ProjectList';
import ProjectTypesButtons from './ProjectTypesButtons';
import {APP_DIRECTORIES} from '../../services/directories.constants';
import useDevice from '../../services/useDevice';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {BLUE} from '../../shared/styles.constants';
import Spacer from '../../shared/ui/Spacer';
import {setLoadingStatus} from '../home/home.slice';
import UserProfile from '../user/UserProfile';

const MyStraboSpot = ({openMainMenuPanel}) => {
  const [importComplete] = useState(false);
  const [importedProject, setImportedProject] = useState({});
  const [showSection, setShowSection] = useState('none');

  const dispatch = useDispatch();
  const {doesDeviceBackupDirExist, getExternalProjectData, openURL, makeDirectory} = useDevice();

  useEffect(() => {
    console.log('UE MyStraboSpot []');
    if (Platform.OS !== 'web') checkBackupDir().catch(err => console.error('Error checking for backup dir', err));
  }, []);

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

  const checkAndroidDownloadDir = async () => {
    const exists = await doesDeviceBackupDirExist(undefined, true);
    if (!exists) await makeDirectory(APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID);
  };

  const getExportedProject = async () => {
    dispatch(setLoadingStatus({bool: true, view: 'home'}));
    const res = await getExternalProjectData();
    console.log('EXTERNAL PROJECT', res);
    if (!isEmpty(res)) {
      setImportedProject(res);
      setShowSection('importData');
    }
    dispatch(setLoadingStatus({bool: false, view: 'home'}));
  };

  const handleImportComplete = (value) => {
    console.log('ImportComplete value', value);
    dispatch(setLoadingStatus({bool: false, view: 'home'}));
    setShowSection('deviceProjects');
  };

  const renderSectionView = () => {
    switch (showSection) {
      case 'none':
        return (
          <View style={{padding: 10}}>
            <UserProfile/>
            {Platform.OS !== 'web' && (
              <>
                <Spacer/>
                <ProjectTypesButtons
                  onLoadProjectsFromServer={() => setShowSection('serverProjects')}
                  onLoadProjectsFromDevice={() => setShowSection('deviceProjects')}
                  onLoadProjectsFromDownloadsFolder={() => getExportedProject()}
                  onStartNewProject={() => setShowSection('new')}
                />
              </>
            )}
          </View>
        );
      case 'serverProjects':
        return (
          <View style={{flex: 1}}>
            <ProjectList source={'server'}/>
            <ActiveProjectList/>
          </View>
        );
      case 'deviceProjects':
        return (
          <View style={{flex: 1}}>
            <ProjectList source={'device'}/>
            <View style={{marginBottom: 20}}>
              <ActiveProjectList/>
              {Platform.OS === 'ios' && <Button
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
              />}
            </View>
          </View>
        );
      case 'importData':
        return (
          <ImportProjectFromZip
            importedProject={importedProject}
            visibleSection={section => setShowSection(section)}
            setImportComplete={handleImportComplete}
            importComplete={importComplete}
            setLoading={value => dispatch(setLoadingStatus(
              {bool: value, view: 'home'}))} //TODO: Check to see if this can be removed or used else where
          />
        );
      case 'new':
        return (
          <View style={{flex: 1}}>
            <NewProjectForm openMainMenuPanel={openMainMenuPanel} source={'new'}/>
          </View>
        );
    }
  };

  return (
    <>
      <View style={{alignItems: 'flex-start'}}>
        {showSection !== 'none' && (
          <Button
            title={'Back to My StraboSpot'}
            titleStyle={commonStyles.standardButtonText}
            type={'clear'}
            onPress={() => setShowSection('none')}
            icon={{
              name: 'chevron-back-outline',
              type: 'ionicon',
              size: 20,
              color: BLUE,
            }}
          />
        )}
      </View>
      {renderSectionView()}
    </>
  );
};

export default MyStraboSpot;
