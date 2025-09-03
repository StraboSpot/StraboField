import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/Helpers';
import overlayStyles from '../../home/overlays/overlay.styles';

const LoadProjectButtons = ({
                              onLoadProjectsFromDevice,
                              onLoadProjectsFromDownloadsFolder,
                              onLoadProjectsFromServer,
                              onStartNewProject,
                            }) => {
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  return (
    <>
      <View style={{paddingHorizontal: 10}}>
        <Button
          buttonStyle={commonStyles.standardButton}
          containerStyle={commonStyles.standardButtonContainer}
          onPress={onStartNewProject}
          title={'New'}
          titleStyle={commonStyles.standardButtonText}
          type={'outline'}
        />
        {!isEmpty(user.name) && isOnline.isConnected && (
          <Button
            buttonStyle={commonStyles.standardButton}
            containerStyle={commonStyles.standardButtonContainer}
            onPress={onLoadProjectsFromServer}
            title={'Download'}
            titleStyle={commonStyles.standardButtonText}
            type={'outline'}
          />
        )}
        <Button
          buttonStyle={commonStyles.standardButton}
          containerStyle={commonStyles.standardButtonContainer}
          onPress={onLoadProjectsFromDevice}
          title={'Open'}
          titleStyle={commonStyles.standardButtonText}
          type={'outline'}
        />
        {!isEmpty(user.name) && !isOnline.isConnected && (
          <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>
            Please connect to the Internet.
          </Text>
        )}
        <Button
          buttonStyle={commonStyles.standardButton}
          containerStyle={commonStyles.standardButtonContainer}
          onPress={onLoadProjectsFromDownloadsFolder}
          title={'Import'}
          titleStyle={commonStyles.standardButtonText}
          type={'outline'}
        />
      </View>
    </>
  );
};

export default LoadProjectButtons;
