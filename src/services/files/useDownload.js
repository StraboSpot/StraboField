import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import {classifyDatasetChange, DATASET_STATUS} from './syncConflicts.helpers';
import {
  clearConflictedDatasetId,
  removePendingDatasetId,
  resetSyncState,
  setLastSyncedDatasetTimestamps,
  setLastSyncedProjectTimestamp,
  setTransferringImages,
} from '../../modules/connections/connections.slice';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setIsProjectLoadSelectionModalVisible,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
  setStatusMessageModalTitle,
} from '../../modules/home/home.slice';
import {useImages} from '../../modules/images';
import {normalizeCustomMapId, stripMapboxToken} from '../../modules/maps/custom-maps/customMaps.helpers';
import {MAP_PROVIDERS} from '../../modules/maps/maps.constants';
import {addedCustomMapsFromBackup} from '../../modules/maps/maps.slice';
import {
  addedDataset,
  addedDatasetFromServer,
  addedDatasets,
  addedProjectFromServer,
  setActiveDatasets,
  setActiveDatasetsMultiple,
  setTargetDataset,
} from '../../modules/project/projects.slice';
import useProject from '../../modules/project/useProject';
import {addedSpotsFromServer} from '../../modules/spots/spots.slice';
import {setUserData} from '../../modules/user/userProfile.slice';
import {isEmpty, toError} from '../../shared/helpers';
import {store} from '../../store/ConfigureStore';
import useResetState from '../../store/useResetState';
import useDevice from '../device/useDevice';
import useServerRequests from '../network/useServerRequests';

let customMapsToSave = {};
let datasetsObjToSave = {};
let imagesDownloadedCount = 0;
let imagesFailedCount = 0;
let spotsToSave = [];
let tempActiveDatasetsIds, tempTargetDatasetId;

// Every caller shares the accumulators above, so a second download would reset the arrays the first is still
// filling and save a mixed set. Module scope too, since the project list, QAQC and auto-login all start downloads.
let isDownloadInFlight = false;

const useDownload = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {activeDatasetsIds, project, targetDatasetId} = useSelector(state => state.project);
  const spots = useSelector(state => state.spot.spots);
  const encodedLogin = useSelector(state => state.user.encoded_login);
  const {endpoint, isSelected} = useSelector(state => state.connections.databaseEndpoint);
  const connectionType = useSelector(state => state.connections.isOnline?.type);
  const isPendingImagesChanges = useSelector(state => state.connections.isPendingImagesChanges);
  const isWifiOnlyForImages = useSelector(state => state.connections.isWifiOnlyForImages);

  const {doesDeviceDirectoryExist, downloadAndSaveProfileImage, downloadImageAndSave} = useDevice();
  const {doesImageExistOnDevice, gatherNeededImages} = useImages();
  const {createDataset} = useProject();
  const {clearProject} = useResetState();
  const {getDatasets, getDatasetSpots, getProfile, getProfileImage, getProject, testCustomMapUrl} = useServerRequests();

  const resetDownloadState = () => {
    customMapsToSave = {};
    datasetsObjToSave = {};
    spotsToSave = [];
    imagesDownloadedCount = 0;
    imagesFailedCount = 0;
    tempActiveDatasetsIds = undefined;
    tempTargetDatasetId = undefined;
  };

  /* Internal Functions */

  const doGetDatasetSpots = async (datasets, encodedLoginScoped) => {
    if (datasets.length >= 1) {

      // Synchronous download
      await datasets.reduce(async (previousPromise, dataset) => {
        await previousPromise;
        await downloadSpots(dataset, encodedLoginScoped);
      }, Promise.resolve());
    }
  };

  const downloadDatasets = async (selectedProject, encodedLoginScoped) => {
    try {
      dispatch(addedStatusMessage('Downloading Datasets...'));
      const res = await getDatasets(selectedProject.id, encodedLoginScoped);
      const datasets = res?.datasets || [];
      console.log('Datasets Response:', JSON.stringify(res));

      // If same project set active and target dataset to same as before if they still exist
      if (!isEmpty(project) && project.id === selectedProject.id && datasets.length >= 1) {
        const newDatasetIds = datasets.map(d => d.id);
        const updatedActiveDatasetIds = tempActiveDatasetsIds.reduce((acc, tempActiveDatasetId) => {
          console.log('Checking if active dataset still exists:', tempActiveDatasetId);
          return newDatasetIds.includes(tempActiveDatasetId) ? [...acc, tempActiveDatasetId] : acc;
        }, []);
        if (!isEmpty(updatedActiveDatasetIds)) dispatch(setActiveDatasetsMultiple(updatedActiveDatasetIds));
        else dispatch(setActiveDatasets({bool: true, dataset: datasets[0].id}));
        if (newDatasetIds.includes(tempTargetDatasetId)) dispatch(setTargetDataset(tempTargetDatasetId));
        else dispatch(setTargetDataset(datasets[0].id));
      }
      else if (datasets.length >= 1) {
        dispatch(setActiveDatasets({bool: true, dataset: datasets[0].id}));
        dispatch(setTargetDataset(datasets[0].id));
      }
      else {
        const targetDataset = createDataset();
        dispatch(addedDataset(targetDataset));
        dispatch(setActiveDatasets({bool: true, dataset: targetDataset.id}));
        dispatch(setTargetDataset(targetDataset.id));
      }
      datasetsObjToSave = Object.assign({},
        ...datasets.map(item => ({[item.id]: {...item, modified_timestamp: item.modified_timestamp || Date.now()}})));
      await doGetDatasetSpots(datasets, encodedLoginScoped);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Downloaded ' + spotsToSave.length + ' Spots\nDownloaded '
        + Object.keys(datasetsObjToSave).length + ' Datasets\nFinished Downloading Datasets'));
    }
    catch (err) {
      console.error('Error getting datasets:', err);
      throw err;
    }
  };

  // Download Project Properties
  const downloadProject = async (selectedProject, encodedLoginScoped) => {
    try {
      console.log('Downloading Project Properties...');
      dispatch(addedStatusMessage('Downloading Project Properties...'));
      const projectResponse = await getProject(selectedProject.id, encodedLoginScoped);
      if (!isEmpty(project)) {
        if (project.id === selectedProject.id) {
          if (!isEmpty(activeDatasetsIds)) tempActiveDatasetsIds = activeDatasetsIds;
          if (targetDatasetId) tempTargetDatasetId = targetDatasetId;
        }
        clearProject();
      }
      // Strip before anything downstream reads it — loadCustomMaps spreads the whole map object through.
      if (!isEmpty(projectResponse.other_maps)) {
        projectResponse.other_maps = projectResponse.other_maps.map(stripMapboxToken);
      }
      dispatch(addedProjectFromServer(projectResponse));
      if (projectResponse.other_maps && !isEmpty(projectResponse.other_maps)) {
        loadCustomMaps(projectResponse.other_maps);
      }
      console.log('Finished Downloading Project Properties.', projectResponse);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Finished Downloading Project Properties'));
      if (projectResponse.reports && !isEmpty(projectResponse.reports)) {
        await downloadReportImages(projectResponse.reports);
      }
    }
    catch (err) {
      console.error('Error Downloading Project Properties.', err);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Downloading Project Properties. ' + err));
      throw err;
    }
  };

  const downloadReportImages = async (reports) => {
    try {
      let neededImagesIds = [];
      await Promise.all(reports.map(async (report) => {
        await Promise.all(report.images?.map(async (image) => {
          const doesExist = await doesImageExistOnDevice(image.id);
          if (!doesExist) {
            console.log(image.id + ': Need to download report image.');
            neededImagesIds.push(image.id);
          }
          else console.log(image.id + ': Already exists on device. Not downloading.');
        }));
      }));

      if (!isEmpty(neededImagesIds)) {
        console.log('Downloading Needed Report Images...');
        dispatch(addedStatusMessage('Downloading ' + neededImagesIds.length + ' Needed Memo Images...'));
        // Check path first and if it doesn't exist, then create
        await doesDeviceDirectoryExist(APP_DIRECTORIES.IMAGES);
        for (const imageId of neededImagesIds) {
          const success = await downloadImageAndSave(imageId);
          if (success) imagesDownloadedCount++;
          else imagesFailedCount++;
        }
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage('Finished Downloading Memo Images'));
        if (imagesFailedCount > 0) {
          dispatch(addedStatusMessage(imagesFailedCount + ' Memo Image' + (imagesFailedCount === 1 ? '' : 's')
            + ' Failed To Download'));
        }
      }
    }
    catch (err) {
      dispatch(addedStatusMessage('Error Downloading Memo Images!'));
      console.warn('Error Downloading Report Images: ' + err);
    }
  };

  const downloadSpots = async (dataset, encodedLoginScoped) => {
    try {
      const featureCollection = await getDatasetSpots(dataset.id, encodedLoginScoped);
      if (isEmpty(featureCollection) || !featureCollection.features) {
        console.log(dataset.name + ': No Spots in dataset.');
      }
      else {
        const spotsDownloaded = featureCollection.features;
        const spotImages = await findNeededImages(spotsDownloaded, dataset);
        if (spotImages) {
          datasetsObjToSave[dataset.id] = {...datasetsObjToSave[dataset.id], images: {imageIds: spotImages.imageIds}};
        }
        spotsToSave.push(...spotsDownloaded);
        const spotIds = Object.values(spotsDownloaded).map(spot => spot.properties.id);
        datasetsObjToSave[dataset.id] = {...datasetsObjToSave[dataset.id], spotIds: spotIds};
      }
    }
    catch (err) {
      console.error(dataset.name, ':', 'Error Downloading Spots.', err);
      dispatch(addedStatusMessage('Error Downloading Spots.' + err));
      throw err;
    }
  };

  const findNeededImages = async (spotsDownloaded, dataset) => {
    try {
      const spotImages = await gatherNeededImages(spotsDownloaded, dataset);
      if (spotImages?.imageIds.length > 0) {
        // neededImagesIds is only returned on native — web doesn't cache images locally.
        console.log(dataset.name + ': Images needed', spotImages.neededImagesIds?.length || 0, 'of',
          spotImages.imageIds.length);
        return spotImages;
      }
      else {
        console.log(dataset.name + ': No Images in dataset.');
        return undefined;
      }
    }
    catch (err) {
      console.error(dataset.name, ':', 'Error Gathering Images. Error:', err);
    }
  };

  const loadCustomMaps = (maps) => {
    maps.map(async (map) => {
      const mapId = normalizeCustomMapId(map.id, map.source);
      let providerInfo = MAP_PROVIDERS[map.source];
      if (map.source === 'strabospot_mymaps') {
        if (!isEmpty(endpoint) && isSelected) {
          let tileEndpoint = endpoint.replace('/db', '/strabo_mymaps_check/');
          if (await testCustomMapUrl(tileEndpoint + map.id)) {
            tileEndpoint = endpoint.replace('/db', '/geotiff/tiles/');
            providerInfo = {...providerInfo, url: [tileEndpoint]};
          }
          else throw Error('Invalid IP address');
        }
      }
      const customMap = {
        ...map,
        ...providerInfo,
        id: mapId,
        source: map.source,
      };
      console.log(customMap.id + ': Loaded Custom Map', customMap);
      customMapsToSave = {...customMapsToSave, [customMap.id]: customMap};
    });
  };

  /* Exported Functions */

  // Fetch the server datasets and route each one via classifyDatasetChange (see syncConflicts.helpers).
  // Read live from the store so a stale closure can't misjudge.
  const classifyServerDatasets = async () => {
    if (!encodedLogin || isEmpty(project)) return {conflictIds: [], toPull: []};
    const res = await getDatasets(project.id, encodedLogin);
    const serverDatasets = res?.datasets || [];
    const livePendingIds = store.getState().connections.pendingUploadDatasetIds.map(String);
    const localDatasets = store.getState().project.datasets;
    const baseTimestamps = store.getState().connections.lastSyncedDatasetTimestamps;
    const conflictIds = [];
    const toPull = [];
    serverDatasets.forEach((serverDataset) => {
      const {status} = classifyDatasetChange({
        serverTimestamp: serverDataset.modified_timestamp,
        base: baseTimestamps[serverDataset.id],
        localTimestamp: localDatasets[serverDataset.id]?.modified_timestamp,
        isPendingLocalEdit: livePendingIds.includes(String(serverDataset.id)),
      });
      if (status === DATASET_STATUS.CONFLICT) conflictIds.push(String(serverDataset.id));
      else if (status === DATASET_STATUS.PULL) toPull.push(serverDataset);
    });
    return {conflictIds, toPull};
  };

  // Download + merge the given server datasets' spots, then (when applyProject is set) fetch and apply
  // the project properties. Callers pass only datasets that are safe to overwrite (no pending local edits).
  const applyServerDownloads = async (staleDatasets, {applyProject = false} = {}) => {
    if (staleDatasets.length) {
      resetDownloadState();
      await doGetDatasetSpots(staleDatasets, encodedLogin);
      dispatch(addedSpotsFromServer(spotsToSave));
      // Re-read live pending ids: a local edit may have queued one of these while downloading.
      const livePendingIds = store.getState().connections.pendingUploadDatasetIds.map(String);
      const appliedBaseTimestamps = {};
      staleDatasets
        .filter(serverDataset => !livePendingIds.includes(String(serverDataset.id)))
        .forEach((serverDataset) => {
          const timestamp = serverDataset.modified_timestamp || Date.now();
          // FromServer variant so the merge doesn't re-flag the dataset for sync.
          dispatch(addedDatasetFromServer({
            ...serverDataset,
            modified_timestamp: timestamp,
            ...(datasetsObjToSave[serverDataset.id] || {}),
          }));
          // Local now matches the server for this dataset - record it as the new base.
          appliedBaseTimestamps[serverDataset.id] = timestamp;
        });
      if (!isEmpty(appliedBaseTimestamps)) dispatch(setLastSyncedDatasetTimestamps(appliedBaseTimestamps));
    }

    // Check for missing images when something downloaded or a prior attempt left some pending
    // (retries transient failures). Respect wifi-only since images are large/numerous.
    if ((staleDatasets.length || isPendingImagesChanges) && Platform.OS !== 'web'
      && (connectionType === 'wifi' || !isWifiOnlyForImages)) {
      try {
        // Read live spots: addedSpotsFromServer above isn't reflected in the `spots` selector yet.
        const liveSpots = store.getState().spot.spots;
        const neededImages = await gatherNeededImages(Object.values(liveSpots), {});
        const neededImagesIds = neededImages?.neededImagesIds || [];
        if (neededImagesIds.length) {
          dispatch(setTransferringImages(true));
          await doesDeviceDirectoryExist(APP_DIRECTORIES.IMAGES);
          for (const imageId of neededImagesIds) {
            await downloadImageAndSave(imageId);
          }
        }
        // NOTE: don't touch isPendingImagesChanges here. That flag means "local images pending
        // UPLOAD" and is owned by the upload path. A failed download (e.g. an image referenced by
        // a spot but missing on both device and server) must not re-flag images as pending upload,
        // or the status would never clear for those orphaned references.
      }
      catch (err) {
        console.error('Auto sync: error downloading images', err);
      }
      finally {
        dispatch(setTransferringImages(false));
      }
    }

    // Fetch and apply the server's project copy unless local has unsynced edits. An equal timestamp
    // can still carry server-side merges (tags, memos, templates), so apply on >=. Fetch fresh here
    // (not before the upload) and re-check live sync-needed state so an edit that landed during the
    // uploads/downloads above isn't clobbered.
    if (applyProject) {
      const serverProject = await getProject(project.id, encodedLogin);
      const liveProject = store.getState().project.project;
      if (serverProject && serverProject.modified_timestamp >= liveProject.modified_timestamp
        && !store.getState().connections.isProjectSyncNeeded) {
        dispatch(addedProjectFromServer(serverProject));
        // Local now matches the server for the project - record it as the new base.
        dispatch(setLastSyncedProjectTimestamp(serverProject.modified_timestamp));
      }
    }
  };

  // Resolve a conflict by keeping the server's copy: pull that dataset and discard the local pending edit.
  const keepServerConflict = async (datasetId) => {
    if (!encodedLogin || isEmpty(project)) return;
    const res = await getDatasets(project.id, encodedLogin);
    const serverDataset = (res?.datasets || []).find(dataset => String(dataset.id) === String(datasetId));
    if (!serverDataset) return;
    // Drop the pending flag first so applyServerDownloads will overwrite the dataset's properties.
    dispatch(removePendingDatasetId(datasetId));
    await applyServerDownloads([serverDataset]);
    dispatch(clearConflictedDatasetId(datasetId));
  };

  const downloadUserProfile = async (encodedLoginScoped = encodedLogin) => {
    try {
      let userProfileRes = await getProfile(encodedLoginScoped);

      // The server returns default_manual_measurement as an integer (1/0); coerce to a real boolean so Redux and the
      // measurement toggles never hold the numeric value.
      if ('default_manual_measurement' in userProfileRes) {
        userProfileRes.default_manual_measurement = Boolean(userProfileRes.default_manual_measurement);
      }

      if (Platform.OS === 'web') {
        const userProfileImageBlob = await getProfileImage(encodedLoginScoped);
        if (userProfileImageBlob) {
          const image = URL.createObjectURL(userProfileImageBlob);
          dispatch(setUserData({...userProfileRes, image: image, encoded_login: encodedLoginScoped}));
        }
        else dispatch(setUserData({...userProfileRes, encoded_login: encodedLoginScoped}));
      }
      else {
        await downloadAndSaveProfileImage(encodedLoginScoped);
        dispatch(setUserData({...userProfileRes, encoded_login: encodedLoginScoped}));
      }

      Sentry.setUser({'username': userProfileRes.name, 'email': userProfileRes.email});
    }
    catch (err) {
      // Not a no-op: the server layer rejects with plain strings and useSignIn reads err.message off this.
      throw toError(err);
    }
  };

  const initializeDownload = async (selectedProject, encodedLoginScoped = encodedLogin) => {
    if (isDownloadInFlight) return console.warn('A download is already running. Ignoring the duplicate request.');
    isDownloadInFlight = true;
    // Setup lives inside the try so the finally always reaches it; outside, a throw would strand the flag for good.
    try {
      resetDownloadState();
      if (setIsProjectLoadSelectionModalVisible) dispatch(setIsProjectLoadSelectionModalVisible(false));
      const projectName = selectedProject.name || selectedProject?.description?.project_name || 'Unknown';
      dispatch(setStatusMessageModalTitle(projectName));
      dispatch(clearedStatusMessages());
      dispatch(setIsStatusMessagesModalVisible(true));
      dispatch(setLoadingStatus({view: 'modal', bool: true}));
      dispatch(addedStatusMessage(`Downloading Project: ${projectName}`));
      await downloadProject(selectedProject, encodedLoginScoped);
      await downloadDatasets(selectedProject, encodedLoginScoped);
      console.log('Download Complete! Spots Downloaded!');
      dispatch(addedStatusMessage('------------------'));
      dispatch(addedSpotsFromServer(spotsToSave));
      dispatch(addedDatasets(datasetsObjToSave));
      dispatch(addedCustomMapsFromBackup(customMapsToSave));
      dispatch(resetSyncState());
      // Seed the base for every downloaded dataset and the project: local now matches the server exactly.
      dispatch(setLastSyncedDatasetTimestamps(
        Object.fromEntries(Object.values(datasetsObjToSave).map(d => [d.id, d.modified_timestamp])),
      ));
      dispatch(setLastSyncedProjectTimestamp(store.getState().project.project.modified_timestamp));
      dispatch(addedStatusMessage('Complete!'));
    }
    catch (err) {
      console.error('Error Initializing Download.', err);
      dispatch(addedStatusMessage(`Download Failed!\n\n${err}`));
      throw err;
    }
    finally {
      isDownloadInFlight = false;
      // The status modal blocks both its exits while this is set, so it must clear on every path or it traps.
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
    }
  };

  const initializeDownloadImages = async (dataset, onProgress) => {
    try {
      imagesDownloadedCount = 0;
      imagesFailedCount = 0;
      dispatch(setLoadingStatus({view: 'modal', bool: true}));
      dispatch(clearedStatusMessages());
      dispatch(setIsStatusMessagesModalVisible(true));
      dispatch(addedStatusMessage('Checking for needed images...'));
      const datasetSpots = (dataset.spotIds || []).map(id => spots[id]).filter(Boolean);
      const spotImages = await gatherNeededImages(datasetSpots, dataset);
      const neededImagesIds = spotImages?.neededImagesIds || [];
      console.log('Downloading Needed Images...', neededImagesIds.length);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Downloading Needed Images...'));
      if (!isEmpty(neededImagesIds)) {
        onProgress?.(0, neededImagesIds.length);
        await doesDeviceDirectoryExist(APP_DIRECTORIES.IMAGES);
        for (const imageId of neededImagesIds) {
          const success = await downloadImageAndSave(imageId);
          if (success) imagesDownloadedCount++;
          else imagesFailedCount++;
          onProgress?.(imagesDownloadedCount, neededImagesIds.length);
          console.log('New/Modified Images Saved: ' + imagesDownloadedCount + '/'
            + neededImagesIds.length + ' Failed Images: ' + imagesFailedCount + '/' + neededImagesIds.length);
          dispatch(removedLastStatusMessage());
          dispatch(addedStatusMessage('New/Modified Images Saved: '
            + imagesDownloadedCount + '/' + neededImagesIds.length + '\n'
            + 'Failed Images: ' + imagesFailedCount + '/' + neededImagesIds.length));
        }
        dispatch(removedLastStatusMessage());
        if (imagesFailedCount > 0) {
          dispatch(addedStatusMessage('Finished downloading images but with failures.\n'
            + 'Downloaded Images: ' + imagesDownloadedCount + '/' + neededImagesIds.length + '\n'
            + 'Failed Images: ' + imagesFailedCount + '/' + neededImagesIds.length));
        }
        else {
          dispatch(addedStatusMessage('Finished downloading images: ' + imagesDownloadedCount + '/'
            + neededImagesIds.length));
          dispatch(addedStatusMessage('\nAll needed images have been downloaded for this dataset'));
        }
      }
    }
    catch (err) {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Downloading Images!'));
      dispatch(addedStatusMessage('Complete!'));
      console.warn('Error Downloading Images: ' + err);
    }
    finally {
      // A dataset needing no images used to skip this, leaving the status modal open with no way out.
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
    }
  };

  return {
    applyServerDownloads,
    classifyServerDatasets,
    downloadUserProfile,
    initializeDownload,
    initializeDownloadImages,
    keepServerConflict,
  };
};

export default useDownload;
