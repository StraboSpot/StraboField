import React, {useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import useDevice from '../../../services/useDevice';
import commonStyles from '../../../shared/common.styles';
import {BLUE} from '../../../shared/styles.constants';
import uiStyles from '../../../shared/ui/ui.styles';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../../home/home.slice';
import overlayStyles from '../../home/overlays/overlay.styles';
import {setSelectedProject} from '../projects.slice';
import SaveAndExportModal from './SaveAndExportModal';
import UploadModal from './UploadModal';
import UploadProgressModal from './UploadProgressModal';

const BackupProjectPage = () => {
  console.log('Rendering BackupProjectPage...');

  const dispatch = useDispatch();
  const activeDatasets = useSelector(state => state.project.activeDatasetsIds);
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  const [backupAction, setBackupAction] = useState(undefined);
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
  const [isSaveAndExportModalVisible, setIsSaveAndExportModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  const {openURL} = useDevice();

  const saveProject = () => checkForActiveDatasets('save');

  const exportProject = () => checkForActiveDatasets('export');

  const checkForActiveDatasets = (backupActionToSet) => {
    if (activeDatasets.length > 0) {
      setIsSaveAndExportModalVisible(true);
      setBackupAction(backupActionToSet);
    }
    else {
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('There are no active datasets selected.'));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
  };

  const renderUploadAndBackupButtons = () => {
    return (
      <View style={{paddingHorizontal: 10}}>
        {user.encoded_login && isOnline.isConnected ? (
          <Button
            buttonStyle={commonStyles.standardButton}
            containerStyle={commonStyles.standardButtonContainer}
            onPress={() => {
              dispatch(setSelectedProject({source: '', project: ''}));
              setIsUploadModalVisible(true);
            }}
            title={'Upload'}
            titleStyle={commonStyles.standardButtonText}
            type={'outline'}
          />
        ) : (
          <View style={uiStyles.spacer}>
            <Text style={overlayStyles.importantText}>Please log in to upload your project.</Text>
          </View>
        )}
        <Button
          buttonStyle={commonStyles.standardButton}
          containerStyle={commonStyles.standardButtonContainer}
          onPress={saveProject}
          title={'Save'}
          titleStyle={commonStyles.standardButtonText}
          type={'outline'}
        />
        <Button
          buttonStyle={commonStyles.standardButton}
          containerStyle={commonStyles.standardButtonContainer}
          onPress={exportProject}
          title={Platform.OS === 'ios' ? 'Save & Zip' : 'Save & Export to Zip'}
          titleStyle={commonStyles.standardButtonText}
          type={'outline'}
        />
      </View>
    );
  };

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
          <Button
            buttonStyle={commonStyles.standardButton}
            containerStyle={commonStyles.buttonPadding}
            icon={{
              name: 'file-tray-full-outline',
              type: 'ionicon',
              color: BLUE,
            }}
            iconContainerStyle={{paddingRight: 10}}
            onPress={() => openURL('ProjectBackups')}
            title={'View/Edit Files on Device'}
            titleStyle={commonStyles.standardButtonText}
            type={'outline'}
          />
        </View>
      )}

      {/* Modals */}
      {isSaveAndExportModalVisible && (
        <SaveAndExportModal
          backupAction={backupAction}
          closeModal={() => setIsSaveAndExportModalVisible(false)}
        />
      )}
      {isUploadModalVisible && <UploadModal closeModal={() => setIsUploadModalVisible(false)}/>}
      <UploadProgressModal
        isProgressModalVisible={isProgressModalVisible}
      />
    </View>
  );
};

export default BackupProjectPage;
