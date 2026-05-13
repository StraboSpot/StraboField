import React from 'react';
import {Image, View} from 'react-native';

import {useSelector} from 'react-redux';

import statusBarStyles from './statusBar.styles';

const accessPointIcon = require('../../assets/icons/ConnectionStatusButton_connected.png');
const offlineIcon = require('../../assets/icons/ConnectionStatusButton_offline.png');
const onlineIcon = require('../../assets/icons/ConnectionStatusButton_online.png');

const ConnectionStatusIcon = () => {
  /* Data Hooks */

  const isOnline = useSelector(state => state.connections.isOnline);

  /* Logic Helpers */

  const getNetworkStatusIcon = () => {
    if (isOnline.isConnected && isOnline.isInternetReachable) return onlineIcon;
    else if (!isOnline.isConnected && !isOnline.isInternetReachable) return offlineIcon;
    else return accessPointIcon;
  };

  /* View */

  return (
    <View style={statusBarStyles.connectionStatusContainer}>
      <Image
        source={getNetworkStatusIcon()}
        style={statusBarStyles.statusBarIcon}
      />
    </View>
  );
};

export default ConnectionStatusIcon;
