import {useCallback, useEffect, useRef} from 'react';
import {AppState} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {
  clearAllPendingDatasetIds,
  clearProjectDirty,
  setAutoUploading,
  setNextAutoUploadTime,
} from '../../modules/connections/connections.slice';
import useUpload from '../files/useUpload';

const useAutoUpload = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline?.isConnected);
  const isProjectDirty = useSelector(state => state.connections.isProjectDirty);
  const pendingIds = useSelector(state => state.connections.pendingUploadDatasetIds);
  const uploadFrequency = useSelector(state => state.connections.backupFrequency?.upload);

  const {uploadProject, uploadDatasetsByIds} = useUpload();
  const prevOnlineRef = useRef(false);

  /* Internal Functions */

  const UPLOAD_INTERVAL_MS = uploadFrequency * 60 * 1000;

  const tryUpload = useCallback(async () => {
    if (!isOnline || (!isProjectDirty && !pendingIds.length)) return;
    try {
      dispatch(setAutoUploading(true));
      if (isProjectDirty) await uploadProject();
      if (pendingIds.length) await uploadDatasetsByIds(pendingIds);
      dispatch(clearProjectDirty());
      dispatch(clearAllPendingDatasetIds());
      console.log('Auto upload complete.');
    }
    catch (err) {
      console.error('Auto upload failed:', err);
    }
    finally {
      dispatch(setAutoUploading(false));
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
    if (!isOnline || !UPLOAD_INTERVAL_MS) {
      dispatch(setNextAutoUploadTime(null));
      return;
    }
    dispatch(setNextAutoUploadTime(Date.now() + UPLOAD_INTERVAL_MS));
    const timer = setInterval(() => {
      dispatch(setNextAutoUploadTime(Date.now() + UPLOAD_INTERVAL_MS));
      tryUpload();
    }, UPLOAD_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isOnline, tryUpload, uploadFrequency]);
};

export default useAutoUpload;
