import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';

import {useSelector} from 'react-redux';

const AutoSaveCountdown = () => {

  /* Data Hooks */

  const saveFrequency = useSelector(state => state.connections.backupFrequency?.save);
  const isAutoSaving = useSelector(state => state.connections.isAutoSaving);
  const nextAutoSaveTime = useSelector(state => state.connections.nextAutoSaveTime);

  /* Local State */

  const [countdown, setCountdown] = useState(null);

  /* Side Effects */

  useEffect(() => {
    const updateCountdown = () => {
      if (!nextAutoSaveTime) setCountdown(null);
      else setCountdown(Math.max(0, Math.ceil((nextAutoSaveTime - Date.now()) / 1000)));
    };
    updateCountdown();
    const ticker = setInterval(updateCountdown, 1000);
    return () => clearInterval(ticker);
  }, [nextAutoSaveTime]);

  /* Logic Helpers */

  const formatCountdown = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
  };

  /* View */

  return (
    <Text style={{paddingVertical: 5}}>
      {isAutoSaving ? 'Auto saving...'
        : !saveFrequency ? 'Auto save is off.'
          : countdown !== null ? `Next auto save in ${formatCountdown(countdown)}` : ''}
    </Text>
  );
};

export default AutoSaveCountdown;
