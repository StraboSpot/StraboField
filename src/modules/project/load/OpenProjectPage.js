import React, {useState} from 'react';
import {Platform, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import useDevice from '../../../services/useDevice';
import useImport from '../../../services/useImport';
import commonStyles from '../../../shared/common.styles';
import {BLUE} from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import {
  setIsProjectLoadSelectionModalVisible,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
  setStatusMessageModalTitle,
} from '../../home/home.slice';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';

// Open project on device in StraboSpot app directory
const OpenProjectPage = () => {
  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [projectToOpen, setProjectToOpen] = useState(null);

  const {loadProjectFromDevice} = useImport();
  const {openURL} = useDevice();

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
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
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
            title={'My StraboField Projects'}
            headerTitle={'Open Local Copy'}
          />
        )}
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

      {/* Modal */}
      {isConfirmOverwriteModalVisible && (
        <ConfirmOverwriteModal
          closeModal={closeConfirmOverwriteModal}
          loadProject={() => openProject(projectToOpen)}
        />
      )}
    </>
  );
};

export default OpenProjectPage;
