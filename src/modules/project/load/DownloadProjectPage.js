import React, {useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import useDownload from '../../../services/useDownload';
import {setIsProjectLoadSelectionModalVisible} from '../../home/home.slice';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import DatasetPreferencesModal from '../datasets/DatasetPreferencesModal';
import ProjectList from '../ProjectList';

// Download Project
const DownloadProjectPage = ({closeMainMenuPanel}) => {
  const dispatch = useDispatch();

  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const project = useSelector(state => state.project.project);

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [isDatasetsPreferencesModalVisible, setIsDatasetsPreferencesModalVisible] = useState(false);
  const [projectToDownload, setProjectToDownload] = useState(null);

  const {initializeDownload} = useDownload();

  const source = 'server';

  const closeConfirmOverwriteModal = () => setIsConfirmOverwriteModalVisible(false);

  const closeProjectLoadModal = () => {
    if (closeMainMenuPanel) closeMainMenuPanel();
    setIsDatasetsPreferencesModalVisible(false);
    if (isProjectLoadSelectionModalVisible) dispatch(setIsProjectLoadSelectionModalVisible(false));
  };

  const confirmDownloadProject = async (projectSelected) => {
    setProjectToDownload(projectSelected);
    if (isProjectLoadSelectionModalVisible) {
      await initializeDownload(projectSelected, undefined, setIsDatasetsPreferencesModalVisible);
    }
    else setIsConfirmOverwriteModalVisible(true);
  };

  const downloadProject = async () => {
    closeConfirmOverwriteModal();
    await initializeDownload(projectToDownload, undefined, setIsDatasetsPreferencesModalVisible);
  };

  const getTextOverride = () => {
    if (project.id === projectToDownload.id && project.modified_timestamp >= projectToDownload.modified_timestamp) {
      return 'The select project to download is NOT NEWER than the current project. Are you sure you want to'
        + ' overwrite the current project?';
    }
    else return undefined;
  };

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1}}>
        {!isProjectLoadSelectionModalVisible && (
          <SidePanelHeader
            backButton={() => dispatch(setSidePanelVisible({bool: false}))}
            headerTitle={'Download Project'}
            title={'My StraboField Projects'}
          />
        )}
        <ProjectList onProjectPress={confirmDownloadProject} source={source}/>
      </View>

      {/* Modal */}
      {isConfirmOverwriteModalVisible && (
        <ConfirmOverwriteModal
          closeModal={closeConfirmOverwriteModal}
          loadProject={downloadProject}
          textOverride={getTextOverride()}
        />
      )}
      {isDatasetsPreferencesModalVisible && <DatasetPreferencesModal closeModal={closeProjectLoadModal}/>}
    </View>
  );
};

export default DownloadProjectPage;
