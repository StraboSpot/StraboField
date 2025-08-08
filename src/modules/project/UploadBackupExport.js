import React, {useState} from 'react';
import {Linking, Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {setSelectedProject} from './projects.slice';
import useDevice from '../../services/useDevice';
import commonStyles from '../../shared/common.styles';
import {BLUE} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import SectionDivider from '../../shared/ui/SectionDivider';
import Spacer from '../../shared/ui/Spacer';
import uiStyles from '../../shared/ui/ui.styles';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';
import overlayStyles from '../home/overlays/overlay.styles';
import {BackupModal, UploadModal, UploadProgressModal} from '../project/modals/index';

const UploadBackAndExport = () => {
  console.log('UploadBackAndExport Render');

  const dispatch = useDispatch();
  const activeDatasets = useSelector(state => state.project.activeDatasetsIds);
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  const [isBackupModalVisible, setIsBackupModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
  const {openURL} = useDevice();

  const checkForActiveDatasets = () => {
    if (activeDatasets.length > 0) {
      dispatch(setSelectedProject({source: '', project: ''}));
      setIsBackupModalVisible(true);
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
        {user.encoded_login ? (
          <Button
            containerStyle={commonStyles.standardButtonContainer}
            title={isOnline.isConnected ? 'Upload to Server' : 'Need to be connected to server'}
            buttonStyle={commonStyles.standardButton}
            titleStyle={commonStyles.standardButtonText}
            onPress={() => {
              dispatch(setSelectedProject({source: '', project: ''}));
              setIsUploadModalVisible(true);
            }}
            disabled={!isOnline.isConnected}
          />
        ) : (
          <View style={uiStyles.spacer}>
            <Text style={overlayStyles.importantText}>If you are attempting to upload the project,
              check to see if you are logged in
            </Text>
          </View>
        )}
        <Button
          title={'Save Local Copy'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={checkForActiveDatasets}
        />
        <Button
          title={'Export to Zip'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={() => checkForActiveDatasets()}
        />
        {Platform.OS === 'ios'
          && (
            <View style={{padding: 10}}>
              <Text style={{...overlayStyles.statusMessageText}}>After backing up,
                to further preserve your data please copy your project backups out of the StraboSpot2/ProjectBackups
                folder to a
                different folder in the iOS app Files/On My IPad! If online, you can find detailed instructions
                <Text style={{color: BLUE}} onPress={openMovingProjectBackupsURL}> here</Text>.
              </Text>
            </View>
          )
        }
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
      <BackupModal
        visible={isBackupModalVisible}
        closeModal={() => setIsBackupModalVisible(false)}
      />
      <UploadModal
        visible={isUploadModalVisible}
        closeModal={() => setIsUploadModalVisible(false)}
      />
      <UploadProgressModal
        isProgressModalVisible={isProgressModalVisible}
      />
      {/*<Divider sectionText={'export'}/>*/}
      {/*{renderExportButtons()}*/}
      {/*<Divider sectionText={'restore project from backup'}/>*/}
    </View>
  );
};

export default UploadBackAndExport;
