import React, {useState} from 'react';
import {Linking, Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {UploadModal} from './modals';
import useDevice from '../../services/useDevice.web';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {BLUE} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import uiStyles from '../../shared/ui/ui.styles';
import overlayStyles from '../home/overlays/overlay.styles';

const ProjectTypesButtons = ({
                               onDeleteProject,
                               onLoadProjectsFromDevice,
                               onLoadProjectsFromDownloadsFolder,
                               onLoadProjectsFromServer,
                               onStartNewProject,
                             }) => {
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  const {openURL} = useDevice();

  const importLocation = Platform.OS === 'ios' ? 'Documents/Strabofield/Distribution'
    : 'Downloads/StraboSpot2/Backups';

  const openMovingProjectBackupsURL = async () => {
    const url = 'https://strabospot.org/files/helpFiles/Moving_Project_Backups_Out_of%20StraboSpot2.pdf';
    const canOpen = await Linking.canOpenURL(url);
    canOpen ? await Linking.openURL(url) : alert('Need to be online');
  };

  return (
    <>
      <View>
        <Button
          title={'Start a New Project'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={onStartNewProject}
        />
        <Button
          title={'Open Local Copy'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={onLoadProjectsFromDevice}
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
        {isEmpty(user.name) && (
          <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>
            Please Log In.
          </Text>
        )}
        {!isEmpty(user.name) && isOnline.isConnected && (
          <Button
            title={'Download Project'}
            containerStyle={commonStyles.standardButtonContainer}
            buttonStyle={commonStyles.standardButton}
            titleStyle={commonStyles.standardButtonText}
            onPress={onLoadProjectsFromServer}
          />
        )}
        {!isEmpty(user.name) && !isOnline.isConnected && (
          <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>
            Please connect to the Internet.
          </Text>
        )}
        <Button
          title={'Import Project from Zip'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={onLoadProjectsFromDownloadsFolder}
        />
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
        {Platform.OS === 'android' && (
          <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>
            *The imported project should only be a .zip file in the {importLocation} folder.
          </Text>
        )}
        <Button
          title={'Delete Local Copy'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={onDeleteProject}
        />
      </View>

      {/* Modals */}
      <UploadModal
        visible={isUploadModalVisible}
        closeModal={() => setIsUploadModalVisible(false)}
      />

    </>
  );
};

export default ProjectTypesButtons;
