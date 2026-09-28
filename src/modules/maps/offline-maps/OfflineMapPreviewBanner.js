import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useSelector} from 'react-redux';

import {getOfflineMapTitle} from './offlineMaps.helpers';
import styles from './offlineMaps.styles';
import useMapsOffline from './useMapsOffline';
import {truncateText} from '../../../shared/helpers';

// Names the downloaded map standing in for the live basemap, so a preview is never mistaken for the real map
const OfflineMapPreviewBanner = () => {
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps) || {};
  const previewedOfflineMapId = useSelector(state => state.offlineMap.previewedOfflineMapId);

  const {stopOfflineMapPreview} = useMapsOffline();

  const previewedOfflineMap = offlineMaps[previewedOfflineMapId];

  if (!previewedOfflineMap) return null;
  return (
    <View style={styles.previewBannerContainer}>
      <TouchableOpacity
        onPress={() => stopOfflineMapPreview().catch(console.error)}
        style={styles.previewBanner}
      >
        <Text style={styles.previewBannerText}>
          {`Previewing Offline Map · ${truncateText(getOfflineMapTitle(previewedOfflineMap), 20)}`}
        </Text>
        <Text style={styles.previewBannerSubText}>Tap to stop</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OfflineMapPreviewBanner;
