import React, {useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import SaveAndExportModal from './SaveAndExportModal';
import UploadModal from './UploadModal';
import useDevice from '../../../services/useDevice';
import {BLUE} from '../../../shared/styles.constants';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import uiStyles from '../../../shared/ui/ui.styles';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../../home/home.slice';
import MainMenuPanelListItem from '../../main-menu-panel/MainMenuPanelListItem';
import {setSelectedProject} from '../projects.slice';

const BackupProject = () => {
  console.log('Rendering BackupProject...');

  const dispatch = useDispatch();
  const activeDatasets = useSelector(state => state.project.activeDatasetsIds);
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  const [backupAction, setBackupAction] = useState(undefined);
  const [isSaveAndExportModalVisible, setIsSaveAndExportModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  const {openURL} = useDevice();

  const checkForActiveDatasets = (backupActionToSet) => {
    if (activeDatasets.length > 0) {
      setIsSaveAndExportModalVisible(true);
      setBackupAction(backupActionToSet);
    }
    else {
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('There are no visible datasets selected.'));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
  };

  const exportProject = () => checkForActiveDatasets('export');

  const onUpload = () => {
    dispatch(setSelectedProject({source: '', project: ''}));
    setIsUploadModalVisible(true);
  };

  const renderUploadAndBackupButtons = () => {
    return (
      <>
        {user.encoded_login && isOnline.isConnected ? <MainMenuPanelListItem onPress={onUpload} title={'Upload'}/>
          : (
            <View style={uiStyles.spacer}>
              <Text style={overlayStyles.importantText}>Please log in to upload your project.</Text>
            </View>
          )}
        <FlatListItemSeparator/>
        <MainMenuPanelListItem onPress={saveProject} title={'Save'}/>
        <FlatListItemSeparator/>
        <MainMenuPanelListItem
          onPress={exportProject}
          title={Platform.OS === 'ios' ? 'Save & Zip' : 'Save & Export to Zip'}
        />
      </>
    );
  };

  const saveProject = () => checkForActiveDatasets('save');

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1}}>
        {renderUploadAndBackupButtons()}
      </View>

      {Platform.OS === 'ios' && (
        <View style={{flex: 1, justifyContent: 'flex-end', paddingBottom: 15}}>
          <View style={{padding: 10, alignItems: 'center'}}>
            <Text style={{...uiStyles.sectionDividerText, textAlign: 'center'}}>
              Additional help documents can be found in the Menu -&gt; Help -&gt; Documentation
            </Text>
          </View>
          <OutlineButton
            icon={{
              name: 'file-tray-full-outline',
              type: 'ionicon',
              color: BLUE,
            }}
            onPress={() => openURL('ProjectBackups')}
            title={'View/Edit Files on Device'}
          />
        </View>
      )}

      {/* Modals */}
      <SaveAndExportModal
        backupAction={backupAction}
        closeModal={() => setIsSaveAndExportModalVisible(false)}
        isVisible={isSaveAndExportModalVisible}
      />
      <UploadModal closeModal={() => setIsUploadModalVisible(false)} isVisible={isUploadModalVisible}/>
    </View>
  );
};

export default BackupProject;
