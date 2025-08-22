import React, {useState} from 'react';
import {Linking, Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import useDevice from '../../../services/useDevice';
import commonStyles from '../../../shared/common.styles';
import {BLUE, WARNING_COLOR} from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
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

  const openMovingProjectBackupsURL = async () => {
    const url = 'https://strabospot.org/files/helpFiles/Moving_Project_Backups_Out_of%20StraboSpot2.pdf';
    const canOpen = await Linking.canOpenURL(url);
    canOpen ? await Linking.openURL(url) : alert('Need to be online');
  };

  const renderUploadAndBackupButtons = () => {
    return (
      <View>
        {user.encoded_login && isOnline.isConnected ? (
          <Button
            containerStyle={commonStyles.standardButtonContainer}
            title={'Upload'}
            buttonStyle={commonStyles.standardButton}
            titleStyle={commonStyles.standardButtonText}
            onPress={() => {
              dispatch(setSelectedProject({source: '', project: ''}));
              setIsUploadModalVisible(true);
            }}
          />
        ) : (
          <View style={uiStyles.spacer}>
            <Text style={overlayStyles.importantText}>Please log in to upload your project.</Text>
          </View>
        )}
        <Button
          title={'Save'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={saveProject}
        />
        <Button
          title={Platform.OS === 'ios' ? 'Save & Zip' : 'Save & Export to Zip'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={exportProject}
        />
        {Platform.OS === 'ios' && (
          <View style={{padding: 10}}>
            <Text style={overlayStyles.titleText}>
              <Text style={{color: WARNING_COLOR}}>iOS WARNING{'\n'}</Text>
              After backing up, to further preserve your data, copy your Saved Project out of the
              StraboField/ProjectBackups folder and/or your Zipped Project out of the StraboField/Distribution
              folder to a different folder in the iOS app Files/On My IPad! If online, you can find detailed
              instructions
              <Text style={{color: BLUE}} onPress={openMovingProjectBackupsURL}> here</Text>.
            </Text>
          </View>
        )}
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
        </View>
      )}

      {/* Modals */}
      {isSaveAndExportModalVisible && (
        <SaveAndExportModal
          closeModal={() => setIsSaveAndExportModalVisible(false)}
          backupAction={backupAction}
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
