import React, {useState} from 'react';
import {Platform, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import useDevice from '../../../services/useDevice';
import commonStyles from '../../../shared/common.styles';
import {BLUE} from '../../../shared/styles.constants';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';
import SaveAndExportModal from './SaveAndExportModal';

// Export a saved project on device in StraboSpot app directory
const ExportProjectPage = () => {
  const dispatch = useDispatch();

  const [isSaveAndExportModalVisible, setIsSaveAndExportModalVisible] = useState(false);
  const [projectToExportFilename, setProjectToExportFilename] = useState(null);

  const {openURL} = useDevice();

  const source = 'device';

  const onSelectedProjectForExport = (project) => {
    setProjectToExportFilename(project.fileName);
    setIsSaveAndExportModalVisible(true);
  };

  return (
    <>
      <View style={{flex: 1}}>
        <SidePanelHeader
          backButton={() => dispatch(setSidePanelVisible({bool: false}))}
          title={'My StraboField Projects'}
          headerTitle={'Export Locally Saved Project'}
        />
        <ProjectList onProjectPress={onSelectedProjectForExport} source={source}/>
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

export default ExportProjectPage;
