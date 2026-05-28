import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import useDownload from '../../../services/files/useDownload';
import {MEDIUM_TEXT_SIZE, PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import buttonStyles from '../../../shared/ui/buttons/buttons.styles';
import TextInputModal from '../../../shared/ui/TextInputModal';
import {setIsStatusMessagesModalVisible} from '../../home/home.slice';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';
import {setActiveDatasets, setTargetDataset} from '../projects.slice';
import useProject from '../useProject';

const source = 'server';

// Download Project
const DownloadProject = ({closeMainMenuPanel, closeNotebookPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const {project} = useSelector(state => state.project);
  const {email} = useSelector(state => state.user);

  const {initializeDownload} = useDownload();
  const {addDataset} = useProject();

  /* Local State */

  const [collaborativeDatasetName, setCollaborativeDatasetName] = useState('');
  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [isDatasetNameModalVisible, setIsDatasetNameModalVisible] = useState(false);
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
    const downloadedDatasets = await initializeDownload(inProjectToDownload, undefined);
    if (!inProjectToDownload.isOwner && !inProjectToDownload.isReadOnly) {
      dispatch(setIsStatusMessagesModalVisible(false));
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
      const emailFound = Object.values(downloadedDatasets).some(dataset => dataset.owner_email === email);
      if (emailFound) {
        console.log('Email found in datasets');
        setIsDatasetNameModalVisible(false);
        dispatch(setSidePanelVisible({bool: false}));
      }
      else {
        setTimeout(() => {
          setIsDatasetNameModalVisible(true);
        }, 400);
      }
    }
    else {
      closeMainMenuPanel();
    }
  };

  const onDatasetNameConfirm = async () => {
    const newDataset = await addDataset(collaborativeDatasetName || 'My Dataset');
    dispatch(setActiveDatasets({bool: true, dataset: newDataset.id}));
    dispatch(setTargetDataset(newDataset.id));
    setIsDatasetNameModalVisible(false);
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
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
      <TextInputModal
        buttonText={'Create Dataset'}
        dialogTitle={'Name Your Dataset'}
        onActionPressed={onDatasetNameConfirm}
        onCancelPress={() => {
          dispatch(setSidePanelVisible({bool: false}));
          setIsDatasetNameModalVisible(false);
        }}
        onChangeText={text => setCollaborativeDatasetName(text)}
        placeholder={'Enter dataset name...'}
        value={collaborativeDatasetName}
        visible={isDatasetNameModalVisible}
      >
        <Text style={{textAlign: 'center'}}>
          If you wish to not create a dataset now one can be created in the Datasets page.
        </Text>
      </TextInputModal>
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
