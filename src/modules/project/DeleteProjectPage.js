import React, {useEffect, useState} from 'react';
import {Platform, View} from 'react-native';

import {Button} from '@rn-vui/base';

import {DeleteProjectModal} from './modals';
import ProjectList from './ProjectList';
import useDevice from '../../services/useDevice';
import commonStyles from '../../shared/common.styles';
import {BLUE} from '../../shared/styles.constants';

// Open project on device in StraboSpot app directory
const DeleteProjectPage = () => {

  const [isDeleteProjectModalVisible, setIsDeleteProjectModalVisible] = useState(false);
  const [projectToDeleteFilename, setProjectToDeleteFilename] = useState(null);
  const [doReloadPage, setDoReloadPage] = useState(false);

  const {openURL} = useDevice();

  const source = 'device';

  const closeDeleteProjectModal = () => setIsDeleteProjectModalVisible(false);

  const confirmDeleteProject = (project) => {
    setProjectToDeleteFilename(project.fileName);
    setIsDeleteProjectModalVisible(true);
  };

  // const renderProjectOptionsModal = () => {
  //   return (
  //     <ProjectOptionsDialogBox
  //       currentProject={currentProject}
  //       endpoint={endPoint}
  //       visible={isProjectOptionsModalVisible}
  //       closeModal={() => setIsProjectOptionsModalVisible(false)}
  //       open={() => setIsProjectOptionsModalVisible(true)}
  //       projectDeleted={value => reloadingList(value)}
  //     />
  //   );
  // };

  return (
    <>
      <View style={{flex: 1}}>
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
