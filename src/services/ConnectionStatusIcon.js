import React from 'react';
import {Image, View} from 'react-native';

import {useSelector} from 'react-redux';

import uiStyles from '../shared/ui/ui.styles';

const accessPointIcon = require('../assets/icons/ConnectionStatusButton_connected.png');
const offlineIcon = require('../assets/icons/ConnectionStatusButton_offline.png');
const onlineIcon = require('../assets/icons/ConnectionStatusButton_online.png');

const ConnectionStatusIcon = () => {
  /* Data Hooks / State */

  const isOnline = useSelector(state => state.connections.isOnline);

  /* Logic Helpers */

  const getNetworkStatusIcon = () => {
    if (isOnline.isConnected && isOnline.isInternetReachable) return onlineIcon;
    else if (!isOnline.isConnected && !isOnline.isInternetReachable) return offlineIcon;
    else return accessPointIcon;
  };

  /* View */

  return (
    <View style={uiStyles.connectionStatusContainer}>
      <Image
        source={getNetworkStatusIcon()}
        style={uiStyles.statusBarIcon}
      />
    </View>
  );
};

export default ConnectionStatusIcon;
