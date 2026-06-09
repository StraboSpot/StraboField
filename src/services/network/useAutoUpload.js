import {useCallback, useEffect, useRef} from 'react';
import {AppState} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {clearAllPendingDatasetIds, clearProjectDirty} from '../../modules/connections/connections.slice';
import useUpload from '../files/useUpload';

const UPLOAD_INTERVAL_MS = 60 * 1000;

const useAutoUpload = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline?.isConnected);
  const isProjectDirty = useSelector(state => state.connections.isProjectDirty);
  const pendingIds = useSelector(state => state.connections.pendingUploadDatasetIds);

  const {initializeUpload} = useUpload();
  const prevOnlineRef = useRef(false);

  /* Internal Functions */

  const tryUpload = useCallback(async () => {
    if (!isOnline || (!isProjectDirty && !pendingIds.length)) return;
    try {
      await initializeUpload();
      dispatch(clearProjectDirty());
      dispatch(clearAllPendingDatasetIds());
      console.log('Auto upload complete.');
    }
    catch (err) {
      console.error('Auto upload failed:', err);
    }
  }, [isOnline, isProjectDirty, pendingIds]);

  /* Side Effects */

  // Upload on reconnect
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) tryUpload();
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  // Upload when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') tryUpload();
    });
    return () => sub.remove();
  }, [tryUpload]);

  // Upload on interval (only while online)
  useEffect(() => {
    if (!isOnline) return;
    const timer = setInterval(tryUpload, UPLOAD_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isOnline, tryUpload]);
};

export default useAutoUpload;
