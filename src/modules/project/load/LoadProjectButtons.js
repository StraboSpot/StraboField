import React from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';

const LoadProjectButtons = ({
                              onLoadProjectsFromDevice,
                              onLoadProjectsFromDownloadsFolder,
                              onLoadProjectsFromServer,
                              onStartNewProject,
                            }) => {
  /* Data Hooks */

  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  /* View */

  return (
    <>
      <View style={{paddingHorizontal: 10}}>
        <OutlineButton
          onPress={onStartNewProject}
          title={'New'}
        />
        {!isEmpty(user.name) && isOnline.isConnected && (
          <OutlineButton
            onPress={onLoadProjectsFromServer}
            title={'Download'}
          />
        )}
        <OutlineButton
          onPress={onLoadProjectsFromDevice}
          title={'Open'}
        />
        {!isEmpty(user.name) && !isOnline.isConnected && (
          <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>
            Please connect to the Internet.
          </Text>
        )}
        <OutlineButton
          onPress={onLoadProjectsFromDownloadsFolder}
          title={'Import'}
        />
      </View>
    </>
  );
};

export default LoadProjectButtons;
