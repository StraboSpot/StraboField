import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import useDownload from '../../../services/files/useDownload';
import {MEDIUM_TEXT_SIZE, PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import buttonStyles from '../../../shared/ui/buttons/buttons.styles';
import {setIsStatusMessagesModalVisible} from '../../home/home.slice';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';

const source = 'server';

// Download Project
const DownloadProject = ({closeMainMenuPanel, closeNotebookPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const {project} = useSelector(state => state.project);

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
    try {
      const downloadedDatasets = await initializeDownload(inProjectToDownload);
      // A duplicate request is ignored and hands back nothing - the download already running owns the follow up
      if (!downloadedDatasets) return;
      // A collaborator lands on the Datasets page to see what they downloaded. Owning none of it is fine -
      // the project is theirs to read, and a dataset of their own is theirs to add here when they want one
      if (!inProjectToDownload.isOwner && !inProjectToDownload.isReadOnly) {
        dispatch(setIsStatusMessagesModalVisible(false));
        dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
        dispatch(setSidePanelVisible({bool: false}));
      }
      else closeMainMenuPanel();
    }
    catch (err) {
      // initializeDownload already reported the failure into the status modal, and it rethrows because the web
      // auto-login path needs that. Leave the main menu panel open so the project can be picked again.
      console.error('Error downloading project.', err);
    }
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
            headerTitle={'Download Project'}
            title={'My StraboField Projects'}
          />
        )}
        <View style={styles.labelContainer}>
          <View style={styles.labelRow}>
            <View style={styles.labelView}>
              <Text style={styles.labelText}>My Projects</Text>
            </View>
            <View style={styles.labelSpacer}/>
          </View>
          <View style={styles.labelRow}>
            <View style={styles.labelSpacer}/>
            <View style={styles.labelView}>
              <Text style={styles.labelText}>Collaborative Projects</Text>
            </View>
          </View>
        </View>
        <ButtonGroup
          buttons={['Unshared', 'Shared\nby Me', 'Shared\nwith Me']}
          containerStyle={buttonStyles.buttonGroupContainer}
          onPress={(index) => {
            console.log('Selected index:', index);
            setSelectedButtonIndex(index);
          }}
          selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
          selectedIndex={selectedButtonIndex}
          textStyle={buttonStyles.buttonGroupText}
        />
        <ProjectList onProjectPress={confirmDownloadProject} selectedButtonIndex={selectedButtonIndex} source={source}/>
      </View>

      {/* Modals */}
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

const styles = StyleSheet.create({
  labelContainer: {
    marginBottom: -5,
    marginHorizontal: 10,
  },
  labelRow: {
    flexDirection: 'row',
  },
  labelSpacer: {
    flex: 1,
  },
  labelText: {
    fontSize: MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
  },
  labelView: {
    alignItems: 'center',
    borderColor: 'lightgray',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderTopWidth: 1,
    flex: 2,
    justifyContent: 'center',
  },
});

export default DownloadProject;
