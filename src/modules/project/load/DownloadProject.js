import React, {useState} from 'react';
import {View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import useDownload from '../../../services/useDownload';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';
import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import {PRIMARY_TEXT_COLOR} from '../../../shared/styles.constants';

const source = 'server';

// Download Project
const DownloadProject = ({closeMainMenuPanel, closeNotebookPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const project = useSelector(state => state.project.project);

  const {initializeDownload} = useDownload();

  /* Local State */

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [projectToDownload, setProjectToDownload] = useState(null);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState(0);

  /* Logic Helpers */

  const closeConfirmOverwriteModal = () => setIsConfirmOverwriteModalVisible(false);

  const confirmDownloadProject = async (projectSelected) => {
    setProjectToDownload(projectSelected);
    if (isProjectLoadSelectionModalVisible) await downloadProject(projectSelected);
    else setIsConfirmOverwriteModalVisible(true);
  };

  const downloadProject = async (inProjectToDownload) => {
    closeNotebookPanel();
    closeConfirmOverwriteModal();
    await initializeDownload(inProjectToDownload);
    closeMainMenuPanel();
  };

  const getTextOverride = () => {
    if (project.id === projectToDownload.id && project.modified_timestamp >= projectToDownload.modified_timestamp) {
      return 'The select project to download is NOT NEWER than the current project. Are you sure you want to'
        + ' overwrite the current project?';
    }
    else return undefined;
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1}}>
        {!isProjectLoadSelectionModalVisible && (
          <SidePanelHeader
            backButton={() => dispatch(setSidePanelVisible({bool: false}))}
            // headerTitle={'Download Project'}
            title={'My StraboField Projects'}
          />
        )}
        <ButtonGroup
          // buttonStyle={{padding: 5}}
          buttons={['My Projects', 'Collaboration Projects']}
          containerStyle={{height: 50, borderRadius: 10}}
          onPress={(index) => {
            console.log('Selected index:', index);
            setSelectedButtonIndex(index);
          }}
          selectedButtonStyle={{backgroundColor: '#007AFF'}}
          selectedIndex={selectedButtonIndex}
          textStyle={{color: PRIMARY_TEXT_COLOR, textAlign: 'center'}}

        />
        <ProjectList onProjectPress={confirmDownloadProject} selectedButtonIndex={selectedButtonIndex} source={source}/>
      </View>

      {/* Modal */}
      {isConfirmOverwriteModalVisible && (
        <ConfirmOverwriteModal
          closeModal={closeConfirmOverwriteModal}
          closeNotebookPanel={closeNotebookPanel}
          loadProject={() => downloadProject(projectToDownload)}
          project={projectToDownload}
          textOverride={getTextOverride()}
        />
      )}
    </View>
  );
};

export default DownloadProject;
