import React, {useState} from 'react';
import {Platform, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import {OpenProjectModal, SaveProjectModal} from './modals';
import ProjectList from './ProjectList';
import useDevice from '../../services/useDevice';
import useImport from '../../services/useImport';
import commonStyles from '../../shared/common.styles';
import {BLUE} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import {setIsStatusMessagesModalVisible, setLoadingStatus, setStatusMessageModalTitle} from '../home/home.slice';

// Open project on device in StraboSpot app directory
const OpenProjectPage = () => {
  const dispatch = useDispatch();

  const [isOpenProjectModalVisible, setIsOpenProjectModalVisible] = useState(false);
  const [isSaveProjectModalVisible, setIsSaveProjectModalVisible] = useState(false);
  const [projectToOpen, setProjectToOpen] = useState(null);

  const {loadProjectFromDevice} = useImport();
  const {openURL} = useDevice();

  const source = 'device';

  const closeBackupModal = () => setIsSaveProjectModalVisible(false);

  const closeOpenProjectModal = () => setIsOpenProjectModalVisible(false);

  const confirmOpenProject = (project) => {
    setProjectToOpen(project);
    setIsOpenProjectModalVisible(true);
  };

  const openProject = async () => {
    closeOpenProjectModal();
    try {
      console.log('Selected Project:', projectToOpen);
      dispatch(setLoadingStatus({view: 'modal', bool: true}));
      dispatch(setIsStatusMessagesModalVisible(true));
      const res = await loadProjectFromDevice(projectToOpen.fileName);
      dispatch(setStatusMessageModalTitle(res.project.description.project_name));
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      console.log('Done loading project', res);
    }
    catch (err) {
      console.error('Error loading Project.', err);
      alert('Project not found!', 'Make sure there is a "data.json" file and it is properly named.');
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      dispatch(setIsStatusMessagesModalVisible(false));
    }
  };

  const saveThenOpenProject = () => {
    closeOpenProjectModal();
    setIsSaveProjectModalVisible(true);
  };

  return (
    <>
      <View style={{flex: 1}}>
        <ProjectList onProjectPress={confirmOpenProject} source={source}/>
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

      {/* Modals */}
      {isOpenProjectModalVisible && (
        <OpenProjectModal
          closeModal={closeOpenProjectModal}
          openProject={openProject}
          saveProject={saveThenOpenProject}
        />
      )}
      {isSaveProjectModalVisible && (
        <SaveProjectModal
          callback={openProject}
          closeModal={closeBackupModal}
          visible={isSaveProjectModalVisible}
        />
      )}
    </>
  );
};

export default OpenProjectPage;
