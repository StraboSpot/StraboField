import React from 'react';
import {Linking, Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import useDevice from '../../../services/useDevice';
import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/Helpers';
import {BLUE} from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import uiStyles from '../../../shared/ui/ui.styles';
import overlayStyles from '../../home/overlays/overlay.styles';

const LoadProjectButtons = ({
                              onLoadProjectsFromDevice,
                              onLoadProjectsFromDownloadsFolder,
                              onLoadProjectsFromServer,
                              onStartNewProject,
                            }) => {
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  const openMovingProjectBackupsURL = async () => {
    const url = 'https://strabospot.org/files/helpFiles/Moving_Project_Backups_Out_of%20StraboSpot2.pdf';
    const canOpen = await Linking.canOpenURL(url);
    canOpen ? await Linking.openURL(url) : alert('Need to be online');
  };

  return (
    <>
      <View>
        <Button
          title={'New'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={onStartNewProject}
        />
        <Button
          title={'Open'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={onLoadProjectsFromDevice}
        />
        {!isEmpty(user.name) && isOnline.isConnected && (
          <Button
            title={'Download'}
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
          title={'Import'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
          onPress={onLoadProjectsFromDownloadsFolder}
        />
      </View>
    </>
  );
};

export default LoadProjectButtons;
