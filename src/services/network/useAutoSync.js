import {useCallback, useEffect, useRef} from 'react';
import {AppState, Platform} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {
  setAutoSyncing,
  setNextAutoSyncTime,
  setPendingImagesChanges,
} from '../../modules/connections/connections.slice';
import {setIsImageTransferring} from '../../modules/project/projects.slice';
import useDownload from '../files/useDownload';
import useUpload from '../files/useUpload';
import useUploadImages from '../files/useUploadImages';

const useAutoSync = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const connectionType = useSelector(state => state.connections.isOnline?.type);
  const isOnline = useSelector(state => state.connections.isOnline?.isConnected);
  const isPendingImagesChanges = useSelector(state => state.connections.isPendingImagesChanges);
  const isProjectSyncNeeded = useSelector(state => state.connections.isProjectSyncNeeded);
  const isWifiOnlyForImages = useSelector(state => state.connections.isWifiOnlyForImages);
  const nextAutoSyncTime = useSelector(state => state.connections.nextAutoSyncTime);
  const pendingIds = useSelector(state => state.connections.pendingUploadDatasetIds);
  const projectId = useSelector(state => state.project.project?.id);
  const syncFrequency = useSelector(state => state.connections.backupFrequency?.sync);

  const {checkAndDownloadUpdates} = useDownload();
  const {uploadDatasetsByIds, uploadProject} = useUpload();
  const {initializeImageUpload} = useUploadImages();

  const isSyncingRef = useRef(false);
  const prevOnlineRef = useRef(false);

  /* Internal Functions */

  const SYNC_INTERVAL_MS = syncFrequency * 60 * 1000;

  const trySync = useCallback(async () => {
    if (!isOnline || !projectId || !syncFrequency || isSyncingRef.current) return;
    isSyncingRef.current = true;
    const isPendingDataChanges = isProjectSyncNeeded || pendingIds.length > 0;
    try {
      dispatch(setAutoSyncing(true));
      // Each upload clears its own sync-needed/pending flag on success and re-stamps on rejection.
      // Pending datasets imply the project changed too, so push it to keep the server in sync.
      // If the project upload fails, datasets and images are intentionally skipped (one shared try).
      if (isProjectSyncNeeded || pendingIds.length) await uploadProject();
      if (pendingIds.length) await uploadDatasetsByIds(pendingIds);
      // Upload images when something pushed or a prior attempt left some pending (retries
      // transient failures). Respect wifi-only since images are large/numerous.
      if ((isPendingDataChanges || isPendingImagesChanges) && Platform.OS !== 'web'
        && (connectionType === 'wifi' || !isWifiOnlyForImages)) {
        try {
          const imagesStatus = await initializeImageUpload();
          dispatch(setPendingImagesChanges((imagesStatus?.failed || 0) > 0));
        }
        catch (err) {
          console.error('Auto image upload failed:', err);
          dispatch(setPendingImagesChanges(true));
        }
        finally {
          // initializeImageUpload() owns the connections transferring flag (sets it only when there
          // are images to upload, and clears it). The projects-slice flag is still the caller's to clear.
          dispatch(setIsImageTransferring(false));
        }
      }
      await checkAndDownloadUpdates();
      console.log('Auto sync complete.');
    }
    catch (err) {
      console.error('Auto sync failed:', err);
    }
    finally {
      dispatch(setAutoSyncing(false));
      isSyncingRef.current = false;
    }
  }, [
    connectionType,
    isOnline,
    isPendingImagesChanges,
    isProjectSyncNeeded,
    isWifiOnlyForImages,
    pendingIds,
    projectId,
    syncFrequency,
  ]);

  /* Side Effects */

  // Sync on reconnect
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) trySync();
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  // Sync when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') trySync();
    });
    return () => sub.remove();
  }, [trySync]);

  // Initialize or clear schedule when frequency or online status changes
  useEffect(() => {
    dispatch(setNextAutoSyncTime(isOnline && SYNC_INTERVAL_MS ? Date.now() + SYNC_INTERVAL_MS : null));
  }, [isOnline, syncFrequency]);

  const trySyncRef = useRef(trySync);
  trySyncRef.current = trySync;

  // Fire sync when scheduled time arrives, then reschedule
  useEffect(() => {
    if (!nextAutoSyncTime) return;
    const delay = Math.max(0, nextAutoSyncTime - Date.now());
    const timer = setTimeout(async () => {
      await trySyncRef.current();
      dispatch(setNextAutoSyncTime(isOnline && SYNC_INTERVAL_MS ? Date.now() + SYNC_INTERVAL_MS : null));
    }, delay);
    return () => clearTimeout(timer);
  }, [nextAutoSyncTime]);
};

export default useAutoSync;
