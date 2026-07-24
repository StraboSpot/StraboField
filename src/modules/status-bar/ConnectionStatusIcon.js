import React from 'react';
import {View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import statusBarStyles from './statusBar.styles';
import {CONNECTION_STATUS_ICON_NAMES, ICON_TYPE} from './statusBarIcon.constants';

const ConnectionStatusIcon = () => {
  /* Data Hooks */

  const isOnline = useSelector(state => state.connections.isOnline);

  /* Logic Helpers */

  const getNetworkStatusIcon = () => {
    if (isOnline.isConnected && isOnline.isInternetReachable) return CONNECTION_STATUS_ICON_NAMES.WIFI;
    else if (!isOnline.isConnected && !isOnline.isInternetReachable) return CONNECTION_STATUS_ICON_NAMES.WIFI_OFF;
    else return CONNECTION_STATUS_ICON_NAMES.ACCESS_POINT;
  };

  /* View */

  return (
    <View style={statusBarStyles.connectionStatusContainer}>
      <Icon
        name={getNetworkStatusIcon()}
        size={24}
        type={ICON_TYPE}
      />
    </View>
  );
};

export default ConnectionStatusIcon;
