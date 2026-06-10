import React from 'react';
import {Platform, View} from 'react-native';

import homeStyles from './home.style';
import BackupStatusIcons from '../status-bar/BackupStatusIcons';
import BatteryInfo from '../status-bar/BatteryInfo';
import ConnectionStatusIcon from '../status-bar/ConnectionStatusIcon';

const DeviceInfo = () => {
  if (Platform.OS !== 'web') {
    return (
        <View style={homeStyles.statusBarContainer}>
          <BackupStatusIcons/>
          <View style={homeStyles.connectionStatusIconContainer}>
            <ConnectionStatusIcon/>
          </View>
          <View>
            {<BatteryInfo/>}
          </View>
        </View>
    );
  }
};

export default DeviceInfo;
