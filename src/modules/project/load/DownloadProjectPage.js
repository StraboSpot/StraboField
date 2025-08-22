import React, {useState} from 'react';
import {Platform, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import useDevice from '../../../services/useDevice';
import useDownload from '../../../services/useDownload';
import commonStyles from '../../../shared/common.styles';
import {BLUE} from '../../../shared/styles.constants';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import ProjectList from '../ProjectList';

// Download Project
const DownloadProjectPage = () => {
  const dispatch = useDispatch();

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(false);
  const [projectToOpen, setProjectToOpen] = useState(null);

  const {openURL} = useDevice();
  const {initializeDownload} = useDownload();

  const source = 'server';

  const closeConfirmOverwriteModal = () => setIsConfirmOverwriteModalVisible(false);

  const confirmOpenProject = (project) => {
    setProjectToOpen(project);
    setIsConfirmOverwriteModalVisible(true);
  };

  const downloadProject = async () => {
    closeConfirmOverwriteModal();
    initializeDownload(projectToOpen);
  };

  return (
    <>
      <View style={{flex: 1}}>
        <SidePanelHeader
          backButton={() => dispatch(setSidePanelVisible({bool: false}))}
          title={'My StraboField Projects'}
          headerTitle={'Download Project'}
        />
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
          loadProject={downloadProject}
        />
      )}
    </>
  );
};

export default DownloadProjectPage;
