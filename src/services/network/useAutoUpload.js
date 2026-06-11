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
  const nextAutoUploadTime = useSelector(state => state.connections.nextAutoUploadTime);
  const pendingIds = useSelector(state => state.connections.pendingUploadDatasetIds);
  const uploadFrequency = useSelector(state => state.connections.backupFrequency?.upload);

  const {uploadDatasetsByIds, uploadProject} = useUpload();
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

  // Initialize or clear schedule when frequency or online status changes
  useEffect(() => {
    dispatch(setNextAutoUploadTime(isOnline && UPLOAD_INTERVAL_MS ? Date.now() + UPLOAD_INTERVAL_MS : null));
  }, [isOnline, uploadFrequency]);

  const tryUploadRef = useRef(tryUpload);
  tryUploadRef.current = tryUpload;

  // Fire upload when scheduled time arrives, then reschedule
  useEffect(() => {
    if (!nextAutoUploadTime) return;
    const delay = Math.max(0, nextAutoUploadTime - Date.now());
    const timer = setTimeout(async () => {
      await tryUploadRef.current();
      dispatch(setNextAutoUploadTime(isOnline && UPLOAD_INTERVAL_MS ? Date.now() + UPLOAD_INTERVAL_MS : null));
    }, delay);
    return () => clearTimeout(timer);
  }, [nextAutoUploadTime]);
};

export default useAutoUpload;
