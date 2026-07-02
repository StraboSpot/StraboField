import {useCallback, useEffect, useRef} from 'react';
import {AppState, Platform} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {
  setAutoSyncing,
  setConflictedDatasetIds,
  setManualSyncRequested,
  setNextAutoSyncTime,
  setPendingImagesChanges,
} from '../../modules/connections/connections.slice';
import {setIsSyncConflictModalVisible} from '../../modules/home/home.slice';
import {setIsImageTransferring} from '../../modules/project/projects.slice';
import {store} from '../../store/ConfigureStore';
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

  const {applyServerDownloads, classifyServerDatasets} = useDownload();
  const {uploadDatasetsByIds, uploadProject} = useUpload();
  const {initializeImageUpload} = useUploadImages();

  const isSyncingRef = useRef(false);
  const prevOnlineRef = useRef(false);

  /* Internal Functions */

  const SYNC_INTERVAL_MS = syncFrequency * 60 * 1000;

  const trySync = useCallback(async () => {
    if (!isOnline || !projectId || !syncFrequency || isSyncingRef.current) return;
    isSyncingRef.current = true;
    // Capture live: this cycle may have been triggered by the user pressing "Sync Now".
    const isManualSync = store.getState().connections.isManualSyncRequested;
    try {
      dispatch(setAutoSyncing(true));
      // Classify datasets before pushing so we never clobber something changed on both sides: dataset
      // conflicts wait for the user, the rest pull safely. The project needs no such check - the server
      // merges project-level data (tags, reports, templates) and returns the merged copy, so a project
      // push never conflicts.
      const {conflictIds, toPull} = await classifyServerDatasets();
      const pushableIds = pendingIds.filter(id => !conflictIds.includes(String(id)));

      // Push the project when we have local project edits or datasets to push (a dataset push bumps the
      // project). uploadProject applies the server's merged response back as the new base. When we don't
      // push, applyServerDownloads pulls the server's project (below) if it holds the newer copy.
      const shouldPushProject = isProjectSyncNeeded || pushableIds.length > 0;
      // Each upload clears its own sync-needed/pending flag on success and re-stamps/flags on rejection.
      // If the project upload fails, datasets and images are intentionally skipped (one shared try).
      if (shouldPushProject) await uploadProject();
      if (pushableIds.length) await uploadDatasetsByIds(pushableIds);
      // Upload images when something pushed or a prior attempt left some pending (retries
      // transient failures). Respect wifi-only since images are large/numerous.
      if ((shouldPushProject || isPendingImagesChanges) && Platform.OS !== 'web'
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
      // Pull safe dataset changes; apply the server's (merged) project unless we just pushed it -
      // applyServerDownloads pulls the project when the server holds the newer copy and no local edit is
      // pending.
      await applyServerDownloads(toPull, {applyProject: !shouldPushProject});
      // Merge in any dataset conflicts a mid-cycle push rejection flagged (uploadDataset).
      const liveConflictIds = store.getState().connections.conflictedDatasetIds.map(String);
      const allConflictIds = [...new Set([...conflictIds, ...liveConflictIds])];
      dispatch(setConflictedDatasetIds(allConflictIds));
      // Only open the modal on a manual sync; auto cycles rely on the status-bar badge.
      if (isManualSync && allConflictIds.length) {
        dispatch(setIsSyncConflictModalVisible(true));
      }
      console.log('Auto sync complete.');
    }
    catch (err) {
      console.error('Auto sync failed:', err);
    }
    finally {
      if (isManualSync) dispatch(setManualSyncRequested(false));
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
