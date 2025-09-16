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
    // Server is returning the timestamp w/o the milliseconds so remove
    // the milliseconds from the current project timestamp to compare
    const projectTimestampNoMilliseconds = Math.floor(project.modified_timestamp / 1000);
    if (project.id === projectToDownload.id
      && projectTimestampNoMilliseconds.toString() > projectToDownload.modified_timestamp.toString()) {
      return 'The current project is newer than the project on the server. Are you sure you want to'
        + ' overwrite the current project?';
    }
    else return undefined;
  };

  return (
    <>
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
    </>
  );
};

export default DownloadProjectPage;
