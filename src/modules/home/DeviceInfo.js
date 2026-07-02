import React from 'react';
import {Platform, View} from 'react-native';

import homeStyles from './home.style';
import BackupStatusIcons from '../project/backup/BackupStatusIcons';
import BatteryInfo from '../status-bar/BatteryInfo';
import ConnectionStatusIcon from '../status-bar/ConnectionStatusIcon';

const DeviceInfo = () => {
  if (Platform.OS !== 'web') {
    return (
      <View style={homeStyles.statusBarContainer}>
        <View style={homeStyles.connectionStatusIconContainer}>
          <BackupStatusIcons/>
          <ConnectionStatusIcon/>
          <View style={homeStyles.statusBarDivider}/>
          <BatteryInfo/>
        </View>
      </View>
    );
  }
};

export default DeviceInfo;
