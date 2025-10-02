import React, {useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import useImport from '../../../services/useImport';
import alert from '../../../shared/ui/alert';
import {
  setIsProjectLoadSelectionModalVisible,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
  setStatusMessageModalTitle,
} from '../../home/home.slice';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';

// Open project on device in StraboSpot app directory
const OpenProjectPage = ({closeMainMenuPanel, closeNotebookPanel}) => {
  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [projectToOpen, setProjectToOpen] = useState(null);

  const {loadProjectFromDevice} = useImport();

  const source = 'device';

  const closeConfirmOverwriteModal = () => setIsConfirmOverwriteModalVisible(false);

  const confirmOpenProject = (project) => {
    setProjectToOpen(project);
    if (isProjectLoadSelectionModalVisible) openProject(project);
    else setIsConfirmOverwriteModalVisible(true);
  };

  const openProject = async (project) => {
    closeConfirmOverwriteModal();
    try {
      console.log('Selected Project:', project);
      dispatch(setLoadingStatus({view: 'modal', bool: true}));
      dispatch(setIsStatusMessagesModalVisible(true));
      const res = await loadProjectFromDevice(project.fileName);
      dispatch(setStatusMessageModalTitle(res.project.description.project_name));
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      if (isProjectLoadSelectionModalVisible) dispatch(setIsProjectLoadSelectionModalVisible(false));
      dispatch(setSidePanelVisible({bool: false}));
      console.log('Done loading project', res);
    }
    catch (err) {
      console.error('Error loading Project.', err);
      alert('Project not found!', 'Make sure there is a "data.json" file and it is properly named.');
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      dispatch(setIsStatusMessagesModalVisible(false));
    }
  };

  return (
    <>
      <View style={{flex: 1}}>
        {!isProjectLoadSelectionModalVisible && (
          <SidePanelHeader
            backButton={() => dispatch(setSidePanelVisible({bool: false}))}
            headerTitle={'Open Locally Saved Project'}
            title={'My StraboField Projects'}
          />
        )}
        <ProjectList onProjectPress={confirmOpenProject} source={source}/>
      </View>

      {/* Modal */}
      {isConfirmOverwriteModalVisible && (
        <ConfirmOverwriteModal
          closeMainMenuPanel={closeMainMenuPanel}
          closeModal={closeConfirmOverwriteModal}
          closeNotebookPanel={closeNotebookPanel}
          loadProject={() => openProject(projectToOpen)}
          project={projectToOpen}
        />
      )}
    </>
  );
};

export default OpenProjectPage;
