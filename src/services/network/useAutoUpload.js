import {useCallback, useEffect, useRef} from 'react';
import {AppState} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {
  clearAllPendingDatasetIds,
  clearProjectDirty,
  setAutoUploading,
} from '../../modules/connections/connections.slice';
import useUpload from '../files/useUpload';

const UPLOAD_INTERVAL_MS = 20 * 1000;

const useAutoUpload = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline?.isConnected);
  const isProjectDirty = useSelector(state => state.connections.isProjectDirty);
  const pendingIds = useSelector(state => state.connections.pendingUploadDatasetIds);

  const {uploadProject, uploadDatasetsByIds} = useUpload();
  const prevOnlineRef = useRef(false);

  /* Internal Functions */

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
    if (!isOnline) return;
    const timer = setInterval(tryUpload, UPLOAD_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isOnline, tryUpload]);
};

export default useAutoUpload;
