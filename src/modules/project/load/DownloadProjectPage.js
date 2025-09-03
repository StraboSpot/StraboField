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

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [projectToOpen, setProjectToOpen] = useState(null);

  const {initializeDownload} = useDownload();

  const source = 'server';

  const closeConfirmOverwriteModal = () => setIsConfirmOverwriteModalVisible(false);

  const confirmOpenProject = (project) => {
    setProjectToOpen(project);
    if (isProjectLoadSelectionModalVisible) downloadProject(project);
    else setIsConfirmOverwriteModalVisible(true);
  };

  const downloadProject = async () => {
    closeConfirmOverwriteModal();
    await initializeDownload(projectToOpen);
    if (openMainMenuPanel) openMainMenuPanel();
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
        <ProjectList onProjectPress={confirmOpenProject} source={source}/>
      </View>

      {/* Modal */}
      {isConfirmOverwriteModalVisible && (
        <ConfirmOverwriteModal
          closeModal={closeConfirmOverwriteModal}
          loadProject={downloadProject}
        />
      )}
    </View>
  );
};

export default DownloadProjectPage;
