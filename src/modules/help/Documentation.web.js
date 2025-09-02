import React from 'react';
import {Linking, View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import styles from './documentation.styles';
import {STRABO_APIS} from '../../services/urls.constants';
import {BLUE} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';

const Documentation = () => {
  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  const helpUrl = STRABO_APIS.STRABO + '/help';

  const viewOnlineHelp = async (path) => {
    const canOpen = await Linking.canOpenURL(path);
    canOpen ? (await Linking.openURL(path))
      : alert('Unable to open URL');
  };

  const renderHelpLink = () => (
    <View style={styles.bottomButton}>
      {isOnline && (
        <Button
          icon={
            <Icon
              color={BLUE}
              iconStyle={{paddingRight: 10}}
              name={'globe-outline'}
              size={20}
              type={'ionicon'}
            />
          }
          onPress={() => viewOnlineHelp(helpUrl)}
          title={'StraboSpot Help Center'}
          type={'clear'}
        />
      )}
    </View>
  );

  return <View style={{flex: 1}}>{renderHelpLink()}</View>;
};

export default Documentation;
