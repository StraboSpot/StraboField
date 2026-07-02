import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';

import {useSelector} from 'react-redux';

const AutoSyncCountdown = () => {

  /* Data Hooks */

  const isAutoSyncing = useSelector(state => state.connections.isAutoSyncing);
  const isOnline = useSelector(state => state.connections.isOnline?.isConnected);
  const nextAutoSyncTime = useSelector(state => state.connections.nextAutoSyncTime);
  const syncFrequency = useSelector(state => state.connections.backupFrequency?.sync);

  /* Local State */

  const [countdown, setCountdown] = useState(null);

  /* Side Effects */

  useEffect(() => {
    const updateCountdown = () => {
      if (!nextAutoSyncTime) setCountdown(null);
      else setCountdown(Math.max(0, Math.ceil((nextAutoSyncTime - Date.now()) / 1000)));
    };
    updateCountdown();
    const ticker = setInterval(updateCountdown, 1000);
    return () => clearInterval(ticker);
  }, [nextAutoSyncTime]);

  /* Logic Helpers */

  const formatCountdown = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
  };

  /* View */

  return (
    <Text style={{paddingVertical: 5}}>
      {isAutoSyncing ? 'Auto syncing...'
        : !syncFrequency ? 'Auto sync is off.'
          : !isOnline ? 'Auto sync is paused while offline.'
            : countdown !== null ? `Next auto sync in ${formatCountdown(countdown)}` : ''}
    </Text>
  );
};

export default AutoSyncCountdown;
