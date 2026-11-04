import React, {useState} from 'react';
import {Platform, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch} from 'react-redux';

import DeleteProjectModal from './DeleteProjectModal';
import useDevice from '../../../services/device/useDevice';
import {APP_DIRECTORIES, AUTO_SAVES_FOLDER} from '../../../services/files/directories.constants';
import * as themes from '../../../shared/styles.constants';
import DeleteButton from '../../../shared/ui/buttons/DeleteButton';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import {openedMessageModal} from '../../home/home.slice';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/side-panel/SidePanelHeader';
import ProjectList from '../ProjectList';

const source = 'device';
const TABS = ['My Saves', 'Auto Saves'];

// Delete a project on device in StraboSpot app directory
const DeleteProject = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {openURL, readDirectory} = useDevice();

  /* Local State */

  const [isDeleteProjectModalVisible, setIsDeleteProjectModalVisible] = useState(false);
  // Changed after each delete so the list reloads
  const [listVersion, setListVersion] = useState(0);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [toDelete, setToDelete] = useState({filePaths: []});

  /* Derived Variables */

  const isAutoSavesTab = selectedTabIndex === 1;

  /* Logic Helpers */

  const closeDeleteProjectModal = () => setIsDeleteProjectModalVisible(false);

  const confirmDelete = (filePaths, label, isPlural = false) => {
    setToDelete({filePaths, isPlural, label});
    setIsDeleteProjectModalVisible(true);
  };

  // Read when pressed, so the count in the question matches what is deleted
  const confirmDeleteAll = async () => {
    const fileNames = isAutoSavesTab ? await readDirectory(APP_DIRECTORIES.AUTO_SAVES) || []
      : (await readDirectory(APP_DIRECTORIES.BACKUP_DIR) || []).filter(fileName => fileName !== AUTO_SAVES_FOLDER);
    const count = fileNames.length;
    if (!count) {
      const savesName = isAutoSavesTab ? 'auto saves' : 'My Saves';
      dispatch(openedMessageModal({message: `There are no ${savesName} on this device.`, title: 'Nothing to Delete'}));
      return;
    }
    // All auto saves go with their folder, which the next auto save makes again
    const filePaths = isAutoSavesTab ? [APP_DIRECTORIES.AUTO_SAVES]
      : fileNames.map(fileName => APP_DIRECTORIES.BACKUP_DIR + fileName);
    const label = isAutoSavesTab ? `${count} auto save${count === 1 ? '' : 's'}` : `${count} of My Saves`;
    confirmDelete(filePaths, label, count > 1);
  };

  const confirmDeleteProject = (project) => {
    const label = project.isAutoBackup
      ? `the ${project.displayName} auto save from ${moment(project.modified_timestamp).format('MMM Do YYYY, h:mm a')}`
      : project.fileName;
    confirmDelete([APP_DIRECTORIES.BACKUP_DIR + project.fileName], label);
  };

  /* View */

  return (
    <>
      <View style={{flex: 1}}>
        <SidePanelHeader
          backButton={() => dispatch(setSidePanelVisible({bool: false}))}
          headerTitle={'Delete Locally Saved Project'}
          title={'My StraboField Projects'}
        />
        <ButtonGroup
          buttons={TABS}
          containerStyle={{borderRadius: 10, height: 40, margin: 10}}
          onPress={i => setSelectedTabIndex(i)}
          selectedButtonStyle={{backgroundColor: themes.PRIMARY_ACCENT_COLOR}}
          selectedIndex={selectedTabIndex}
          textStyle={{color: themes.PRIMARY_TEXT_COLOR, fontSize: themes.SMALL_TEXT_SIZE}}
        />
        <ProjectList
          backupType={isAutoSavesTab ? 'auto' : 'manual'}
          doRefresh={listVersion}
          isDeleteList
          onProjectPress={confirmDeleteProject}
          source={source}
        />
        <DeleteButton
          onPress={confirmDeleteAll}
          title={isAutoSavesTab ? 'Delete All Auto Saves' : 'Delete All My Saves'}
        />
        {Platform.OS === 'ios' && (
          <OutlineButton
            icon={{
              name: 'file-tray-full-outline',
              type: 'ionicon',
              color: themes.BLUE,
            }}
            onPress={() => openURL('ProjectBackups')}
            title={'View/Edit Files on Device'}
          />
        )}
      </View>

      {/* Modal */}
      <DeleteProjectModal
        closeModal={closeDeleteProjectModal}
        filePaths={toDelete.filePaths}
        isDeleteProjectModalVisible={isDeleteProjectModalVisible}
        isPlural={toDelete.isPlural}
        label={toDelete.label}
        onDeleted={() => setListVersion(version => version + 1)}
      />
    </>
  );
};

export default DeleteProject;
