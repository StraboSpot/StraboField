import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import {MAX_SAVES} from '../../../services/files/useAutoSave';
import useImport from '../../../services/files/useImport';
import commonStyles from '../../../shared/common.styles';
import * as themes from '../../../shared/styles.constants';
import {
  addedStatusMessage,
  clearedStatusMessages,
  setIsProjectLoadSelectionModalVisible,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
  setStatusMessageModalTitle,
} from '../../home/home.slice';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';

const source = 'device';
const TABS = ['My Saves', 'Auto Saves'];

// Open project on device in StraboSpot app directory
const OpenProject = ({closeMainMenuPanel, closeNotebookPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);

  const {loadProjectFromDevice} = useImport();

  /* Local State */

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [projectToOpen, setProjectToOpen] = useState(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  /* Logic Helpers */

  const closeConfirmOverwriteModal = () => setIsConfirmOverwriteModalVisible(false);

  const confirmOpenProject = async (project) => {
    setProjectToOpen(project);
    if (isProjectLoadSelectionModalVisible) await openProject(project);
    else setIsConfirmOverwriteModalVisible(true);
  };

  const openProject = async (project) => {
    closeNotebookPanel();
    closeConfirmOverwriteModal();
    if (isProjectLoadSelectionModalVisible) dispatch(setIsProjectLoadSelectionModalVisible(false));
    dispatch(setLoadingStatus({view: 'modal', bool: true}));
    dispatch(setIsStatusMessagesModalVisible(true));
    try {
      console.log('Selected Project:', project);
      const res = await loadProjectFromDevice(project.fileName);
      dispatch(setStatusMessageModalTitle(res.project.description.project_name));
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      dispatch(setSidePanelVisible({bool: false}));
      console.log('Done loading project', res);
      closeMainMenuPanel();
    }
    catch (err) {
      console.error('Error loading Project.', err);
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage(
        'Error: Project file not found.\nMake sure there is a "data.json" file and it is properly named.'));
    }
  };

  /* View */

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
        <ButtonGroup
          buttons={TABS}
          containerStyle={{borderRadius: 10, height: 40, margin: 10}}
          onPress={i => setSelectedTabIndex(i)}
          selectedButtonStyle={{backgroundColor: themes.PRIMARY_ACCENT_COLOR}}
          selectedIndex={selectedTabIndex}
          textStyle={{color: themes.PRIMARY_TEXT_COLOR}}
        />
        {selectedTabIndex === 1 && (
          <Text style={[commonStyles.standardDescriptionText, {
            paddingBottom: 8,
            paddingHorizontal: 15,
            textAlign: 'center',
          }]}>
            {`The ${MAX_SAVES} most recent auto saves are kept. Older ones are removed automatically.`}
          </Text>
        )}
        <ProjectList
          backupType={selectedTabIndex === 0 ? 'manual' : 'auto'}
          onProjectPress={confirmOpenProject}
          source={source}
        />
      </View>

      {/* Modal */}
      <ConfirmOverwriteModal
        closeModal={closeConfirmOverwriteModal}
        isVisible={isConfirmOverwriteModalVisible}
        loadProject={() => openProject(projectToOpen)}
        project={projectToOpen}
      />
    </>
  );
};

export default OpenProject;
