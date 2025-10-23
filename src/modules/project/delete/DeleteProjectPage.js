import React, {useEffect, useState} from 'react';
import {Platform, View} from 'react-native';

import {useDispatch} from 'react-redux';

import DeleteProjectModal from './DeleteProjectModal';
import useDevice from '../../../services/useDevice';
import {BLUE} from '../../../shared/styles.constants';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';

// Delete a project on device in StraboSpot app directory
const DeleteProjectPage = () => {
  const dispatch = useDispatch();

  const [doReloadPage, setDoReloadPage] = useState(false);
  const [isDeleteProjectModalVisible, setIsDeleteProjectModalVisible] = useState(false);
  const [projectToDeleteFilename, setProjectToDeleteFilename] = useState(null);

  useEffect(() => {
    //  Need to reload page after saved project deleted
    console.log('doReloadPage: ', doReloadPage);
  }, [doReloadPage]);

  const {openURL} = useDevice();

  const source = 'device';

  const closeDeleteProjectModal = () => setIsDeleteProjectModalVisible(false);

  const confirmDeleteProject = (project) => {
    setProjectToDeleteFilename(project.fileName);
    setIsDeleteProjectModalVisible(true);
  };

  return (
    <>
      <View style={{flex: 1}}>
        <SidePanelHeader
          backButton={() => dispatch(setSidePanelVisible({bool: false}))}
          headerTitle={'Delete Locally Saved Project'}
          title={'My StraboField Projects'}
        />
        <ProjectList doRefresh={doReloadPage} onProjectPress={confirmDeleteProject} source={source}/>
        {Platform.OS === 'ios' && (
          <OutlineButton
            icon={{
              name: 'file-tray-full-outline',
              type: 'ionicon',
              color: BLUE,
            }}
            onPress={() => openURL('ProjectBackups')}
            title={'View/Edit Files on Device'}
          />
        )}
      </View>

      {/* Modal */}
      {/*{isDeleteProjectModalVisible && (*/}
      <DeleteProjectModal
        closeModal={closeDeleteProjectModal}
        isDeleteProjectModalVisible={isDeleteProjectModalVisible}
        projectToDeleteFilename={projectToDeleteFilename}
        setDoReloadPage={setDoReloadPage}
      />
      {/*)}*/}
    </>
  );
};

export default DeleteProjectPage;
