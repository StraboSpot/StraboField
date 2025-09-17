import React, {useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import useDownload from '../../../services/useDownload';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';

// Download Project
const DownloadProjectPage = ({openMainMenuPanel}) => {
  const dispatch = useDispatch();

  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const project = useSelector(state => state.project.project);

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [projectToDownload, setProjectToDownload] = useState(null);

  const {initializeDownload} = useDownload();

  const source = 'server';

  const closeConfirmOverwriteModal = () => setIsConfirmOverwriteModalVisible(false);

  const confirmDownloadProject = async (projectSelected) => {
    setProjectToDownload(projectSelected);
    if (isProjectLoadSelectionModalVisible) {
      await initializeDownload(projectSelected);
      openMainMenuPanel();
    }
    else setIsConfirmOverwriteModalVisible(true);
  };

  const downloadProject = async () => {
    closeConfirmOverwriteModal();
    await initializeDownload(projectToDownload);
  };

  const getTextOverride = () => {
    if (project.id === projectToDownload.id && project.modified_timestamp > projectToDownload.modified_timestamp) {
      return 'The current project is newer than the project on the server. Are you sure you want to'
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
    </View>
  );
};

export default DownloadProjectPage;
