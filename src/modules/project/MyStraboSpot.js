import React, {useEffect, useState} from 'react';
import {FlatList, Platform, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import DeleteProjectPage from './DeleteProjectPage';
import ImportProjectFromZip from './ImportProjectFromZip';
import {SaveProjectModal, UploadModal, UploadProgressModal} from './modals';
import NewProjectForm from './NewProjectForm';
import OpenProjectPage from './OpenProjectPage';
import ProjectList from './ProjectList';
import {setSelectedProject} from './projects.slice';
import ProjectTypesButtons from './ProjectTypesButtons';
import {APP_DIRECTORIES} from '../../services/directories.constants';
import useDevice from '../../services/useDevice';
import {isEmpty} from '../../shared/Helpers';
import Spacer from '../../shared/ui/Spacer';
import {
  addedStatusMessage,
  clearedStatusMessages,
  setIsErrorMessagesModalVisible,
  setLoadingStatus,
} from '../home/home.slice';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';

const MyStraboSpot = ({openMainMenuPanel}) => {
  const dispatch = useDispatch();
  const activeDatasets = useSelector(state => state.project.activeDatasetsIds);

  const [importComplete] = useState(false);
  const [importedProject, setImportedProject] = useState({});
  const [isSaveProjectModalVisible, setIsSaveProjectModalVisible] = useState(false);
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [showSection, setShowSection] = useState('none');

  const {doesDeviceBackupDirExist, getExternalProjectData, makeDirectory} = useDevice();

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

  const checkForActiveDatasets = () => {
    if (activeDatasets.length > 0) {
      dispatch(setSelectedProject({source: '', project: ''}));
      setIsSaveProjectModalVisible(true);
    }
    else {
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('There are no active datasets selected.'));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
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
          <>
            <Spacer/>
            <ProjectTypesButtons
              onDeleteProject={() => {
                setShowSection('deleteProject');
                dispatch(setSidePanelVisible({bool: true, view: null}));
              }}
              onLoadProjectsFromServer={() => {
                setShowSection('serverProjects');
                dispatch(setSidePanelVisible({bool: true, view: null}));
              }}
              onLoadProjectsFromDevice={() => {
                setShowSection('deviceProjects');
                dispatch(setSidePanelVisible({bool: true, view: null}));
              }}
              onLoadProjectsFromDownloadsFolder={() => {
                getExportedProject();
                dispatch(setSidePanelVisible({bool: true, view: null}));
              }}
              onSaveCurrentProject={checkForActiveDatasets}
              onStartNewProject={() => {
                setShowSection('new');
                dispatch(setSidePanelVisible({bool: true, view: null}));
              }}
            />
          </>
        );
      case 'serverProjects':
        return (
          <View style={{flex: 1}}>
            <ProjectList source={'server'}/>
          </View>
        );
      case 'deleteProject':
        return <DeleteProjectPage/>;
      case 'deviceProjects':
        return <OpenProjectPage/>;
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
      <FlatList
        ListHeaderComponent={
          <>
            {renderSectionView()}
          </>
        }
      />

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

export default MyStraboSpot;
