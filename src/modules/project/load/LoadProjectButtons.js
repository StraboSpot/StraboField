import React from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import ConnectionRequiredMessage from '../../../shared/ui/text/ConnectionRequiredMessage';
import useIsConnectionAvailable from '../../connections/useConnectionStatus';

const LoadProjectButtons = ({
                              onLoadProjectsFromDevice,
                              onLoadProjectsFromDownloadsFolder,
                              onLoadProjectsFromServer,
                              onStartNewProject,
                            }) => {
  /* Data Hooks */

  const user = useSelector(state => state.user);

  const isConnectionAvailable = useIsConnectionAvailable();

  /* View */

  return (
    <>
      {!isEmpty(user.name) && !isConnectionAvailable && <ConnectionRequiredMessage actionText={'download a project'}/>}
      <View style={{paddingHorizontal: 10}}>
        <OutlineButton
          onPress={onStartNewProject}
          title={'New'}
        />
        {!isEmpty(user.name) && isConnectionAvailable && (
          <OutlineButton
            onPress={onLoadProjectsFromServer}
            title={'Download'}
          />
        )}
        <OutlineButton
          onPress={onLoadProjectsFromDevice}
          title={'Open'}
        />
        <OutlineButton
          onPress={onLoadProjectsFromDownloadsFolder}
          title={'Import'}
        />
      </View>
    </>
  );
};

export default LoadProjectButtons;
