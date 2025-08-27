import React, {useEffect, useState} from 'react';
import {Platform, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import DeleteProjectModal from './DeleteProjectModal';
import useDevice from '../../../services/useDevice';
import commonStyles from '../../../shared/common.styles';
import {BLUE} from '../../../shared/styles.constants';
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
          title={'My StraboField Projects'}
          headerTitle={'Delete Locally Saved Project'}
        />
        <ProjectList doRefresh={doReloadPage} onProjectPress={confirmDeleteProject} source={source}/>
        <View style={{marginBottom: 20}}>
          {Platform.OS === 'ios' && (
            <Button
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
            />
          )}
        </View>
      </View>

      {/* Modal */}
      {isDeleteProjectModalVisible && (
        <DeleteProjectModal
          closeModal={closeDeleteProjectModal}
          projectToDeleteFilename={projectToDeleteFilename}
          setDoReloadPage={setDoReloadPage}
        />
      )}
    </>
  );
};

export default DeleteProjectPage;
