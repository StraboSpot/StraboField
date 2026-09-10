import React, {useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import useDownload from '../../../services/files/useDownload';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';

const source = 'server';

// Download Project
const DownloadProject = ({closeMainMenuPanel, closeNotebookPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const project = useSelector(state => state.project.project);

  const {initializeDownload} = useDownload();

  /* Local State */

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [projectToDownload, setProjectToDownload] = useState(null);

  /* Logic Helpers */

  const closeConfirmOverwriteModal = () => setIsConfirmOverwriteModalVisible(false);

  const confirmDownloadProject = async (projectSelected) => {
    setProjectToDownload(projectSelected);
    if (isProjectLoadSelectionModalVisible) await downloadProject(projectSelected);
    else setIsConfirmOverwriteModalVisible(true);
  };

  const downloadProject = async (inProjectToDownload) => {
    closeNotebookPanel();
    closeConfirmOverwriteModal();
    try {
      await initializeDownload(inProjectToDownload);
      closeMainMenuPanel();
    }
    catch (err) {
      // initializeDownload already reported the failure into the status modal, and it rethrows because the web
      // auto-login path needs that. Leave the main menu panel open so the project can be picked again.
      console.error('Error downloading project.', err);
    }
  };

  const getTextOverride = () => {
    if (project.id === projectToDownload.id && project.modified_timestamp >= projectToDownload.modified_timestamp) {
      return 'The select project to download is NOT NEWER than the current project. Are you sure you want to'
        + ' overwrite the current project?';
    }
    else return undefined;
  };

  /* View */

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
          closeNotebookPanel={closeNotebookPanel}
          loadProject={() => downloadProject(projectToDownload)}
          project={projectToDownload}
          textOverride={getTextOverride()}
        />
      )}
    </View>
  );
};

export default DownloadProject;
