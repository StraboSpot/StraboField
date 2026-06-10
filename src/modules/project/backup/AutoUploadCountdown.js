import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';

import {useSelector} from 'react-redux';

const AutoUploadCountdown = () => {

  /* Data Hooks */

  const isAutoUploading = useSelector(state => state.connections.isAutoUploading);
  const isOnline = useSelector(state => state.connections.isOnline?.isConnected);
  const nextAutoUploadTime = useSelector(state => state.connections.nextAutoUploadTime);
  const uploadFrequency = useSelector(state => state.connections.backupFrequency?.upload);

  /* Local State */

  const [countdown, setCountdown] = useState(null);

  /* Side Effects */

  useEffect(() => {
    const updateCountdown = () => {
      if (!nextAutoUploadTime) setCountdown(null);
      else setCountdown(Math.max(0, Math.ceil((nextAutoUploadTime - Date.now()) / 1000)));
    };
    updateCountdown();
    const ticker = setInterval(updateCountdown, 1000);
    return () => clearInterval(ticker);
  }, [nextAutoUploadTime]);

  /* Logic Helpers */

  const formatCountdown = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
  };

  /* View */

  return (
    <Text style={{paddingVertical: 5}}>
      {isAutoUploading ? 'Auto uploading...'
        : !uploadFrequency ? 'Auto upload is off.'
          : !isOnline ? 'Auto upload is paused while offline.'
            : countdown !== null ? `Next auto upload in ${formatCountdown(countdown)}` : ''}
    </Text>
  );
};

export default AutoUploadCountdown;
