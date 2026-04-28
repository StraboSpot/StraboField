import React, {useState} from 'react';
import {Platform, View} from 'react-native';

import {useDispatch} from 'react-redux';

import SaveAndExportModal from './SaveAndExportModal';
import useDevice from '../../../services/device/useDevice';
import {PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';

const source = 'device';

// Export a saved project on device in StraboSpot app directory
const ExportProject = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {openURL} = useDevice();

  /* Local State */

  const [isSaveAndExportModalVisible, setIsSaveAndExportModalVisible] = useState(false);
  const [projectToExportFilename, setProjectToExportFilename] = useState(null);

  /* Event Handlers */

  const onSelectedProjectForExport = (project) => {
    setProjectToExportFilename(project.fileName);
    setIsSaveAndExportModalVisible(true);
  };

  /* View */

  return (
    <>
      <View style={{flex: 1}}>
        <SidePanelHeader
          backButton={() => dispatch(setSidePanelVisible({bool: false}))}
          headerTitle={'Export Locally Saved Project'}
          title={'My StraboField Projects'}
        />
        <ProjectList onProjectPress={onSelectedProjectForExport} source={source}/>
        {Platform.OS === 'ios' && (
          <OutlineButton
            icon={{
              name: 'file-tray-full-outline',
              type: 'ionicon',
              color: PRIMARY_ACCENT_COLOR,
            }}
            onPress={() => openURL('ProjectBackups')}
            title={'View/Edit Files on Device'}
          />
        )}
      </View>

      {/* Modal */}
      {isSaveAndExportModalVisible && (
        <SaveAndExportModal
          backupAction={'export'}
          closeModal={() => setIsSaveAndExportModalVisible(false)}
          selectedFilename={projectToExportFilename}
        />
      )}
    </>
  );
};

export default ExportProject;
