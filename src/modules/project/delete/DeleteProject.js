import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch} from 'react-redux';

import DeleteProjectModal from './DeleteProjectModal';
import useDevice from '../../../services/device/useDevice';
import {APP_DIRECTORIES, AUTO_SAVES_FOLDER} from '../../../services/files/directories.constants';
import commonStyles from '../../../shared/common.styles';
import {formatFileSize} from '../../../shared/helpers';
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

  const {getSizeOnDevice, openURL, readDirectory} = useDevice();

  /* Local State */

  const [isDeleteProjectModalVisible, setIsDeleteProjectModalVisible] = useState(false);
  // Changed after each delete so the list and sizes reload
  const [listVersion, setListVersion] = useState(0);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [sizes, setSizes] = useState({});
  const [toDelete, setToDelete] = useState({filePaths: []});

  /* Derived Variables */

  const isAutoSavesTab = selectedTabIndex === 1;
  const tabSize = isAutoSavesTab ? sizes.autoSaves : sizes.mySaves;

  /* Side Effects */

  useEffect(() => {
    const getSizes = async () => {
      try {
        // The auto saves folder sits inside the backup directory, beside the manual saves
        const autoSaves = await getSizeOnDevice(APP_DIRECTORIES.AUTO_SAVES);
        const all = await getSizeOnDevice(APP_DIRECTORIES.BACKUP_DIR);
        setSizes({autoSaves, mySaves: all - autoSaves});
      }
      catch (err) {
        console.error('Error getting the size of the saves:', err);
        setSizes({});
      }
    };
    getSizes();
  }, [listVersion]);

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
      const message = `There are no ${TABS[selectedTabIndex]} on this device.`;
      dispatch(openedMessageModal({message: message, title: 'Nothing to Delete'}));
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
        {/* Every save has at least its data file, so a tab that takes up nothing is empty */}
        {tabSize > 0 && (
          <>
            <Text style={[commonStyles.standardDescriptionText, {paddingTop: 8, textAlign: 'center'}]}>
              {`${TABS[selectedTabIndex]} take up ${formatFileSize(tabSize)} on this device.`}
            </Text>
            <DeleteButton onPress={confirmDeleteAll} title={'Delete All ' + TABS[selectedTabIndex]}/>
          </>
        )}
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
