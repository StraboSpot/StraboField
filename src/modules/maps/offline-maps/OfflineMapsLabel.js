import React from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import homeStyles from '../../home/home.styles';

const OfflineMapLabel = () => {
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps) || {};

  const res = Object.values(offlineMaps).some(offlineMap => offlineMap.isOfflineMapVisible === true);

  if (res) {
    return (
      <View style={homeStyles.offlineMapLabelContainer}>
        <Text style={homeStyles.offlineMapViewLabel}>Offline View</Text>
      </View>
    );
  }
};

export default OfflineMapLabel;
