import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import {classifyDatasetChange, DATASET_STATUS} from './syncConflicts.helpers';
import {useAutoSaveNow} from './useAutoSave';
import {
  clearConflictedDatasetId,
  removePendingDatasetId,
  resetSyncState,
  setLocalSaveNeeded,
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
import useImages from '../../modules/images/useImages';
import {CUSTOM_MAP_SOURCES} from '../../modules/maps/custom-maps/customMaps.constants';
import {normalizeCustomMapId, stripMapboxToken} from '../../modules/maps/custom-maps/customMaps.helpers';
import {MAP_PROVIDERS} from '../../modules/maps/maps.constants';
import {addedCustomMapsFromBackup} from '../../modules/maps/maps.slice';
import {
  addedDataset,
  addedDatasetFromServer,
  addedDatasets,
  addedProjectFromServer,
  setActiveDatasetsMultiple,
  setTargetDataset,
} from '../../modules/project/projects.slice';
import useProject from '../../modules/project/useProject';
import {MISSING_STRABO_USER_ID_MESSAGE, STRABOSAMPLES_LINKED_DATA_KEYS} from '../../modules/samples/samples.constants';
import {getSampleMetadata, getStraboSampleFromResponse} from '../../modules/samples/samples.helpers';
import {addedSpotsFromServer} from '../../modules/spots/spots.slice';
import {setUserData} from '../../modules/user/userProfile.slice';
import {isEmpty, isEqual, toError} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {MODAL_TRANSITION_DELAY} from '../../shared/ui/modals/modal.constants';
import {store} from '../../store/ConfigureStore';
import useResetState from '../../store/useResetState';
import useDevice from '../device/useDevice';
import useServerRequests from '../network/useServerRequests';

let customMapsToSave = {};
let datasetsObjToSave = {};
let imagesDownloadedCount = 0;
let imagesFailedCount = 0;
let spotsToSave = [];

// Every caller shares the accumulators above, so a second download would reset the arrays the first is still
// filling and save a mixed set. Module scope too, since the project list, QAQC and auto-login all start downloads.
let isDownloadInFlight = false;

// Auto sync waits while a download runs, since the download replaces the project it would sync
export const isDownloadRunning = () => isDownloadInFlight;

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

  const {autoSaveNow} = useAutoSaveNow();
  const {doesDeviceDirectoryExist, downloadAndSaveProfileImage, downloadImageAndSave} = useDevice();
  const {doesImageExistOnDevice, gatherNeededImages} = useImages();
  const {createDataset} = useProject();
  const {clearProject} = useResetState();
  const {
    getDatasets,
    getDatasetSpots,
    getProfile,
    getProfileImage,
    getProject,
    getStraboSample,
    testCustomMapUrl,
  } = useServerRequests();

  const resetDownloadState = () => {
    customMapsToSave = {};
    datasetsObjToSave = {};
    spotsToSave = [];
    imagesDownloadedCount = 0;
    imagesFailedCount = 0;
  };

  /* Internal Functions */

  const confirmDownloadWithoutBackup = () => new Promise((resolve) => {
    alert('Backup Failed',
      'The current project could not be saved to the device. Downloading will replace it, and any changes not yet'
      + ' uploaded will be lost.',
      [
        {onPress: () => resolve(false), style: 'cancel', text: 'Cancel'},
        {onPress: () => resolve(true), style: 'destructive', text: 'Download Anyway'},
      ]);
  });

  // Collects into the download's own buffer unless given another, so an auto sync pull can't mix into a download
  const doGetDatasetSpots = async (datasets, encodedLoginScoped, buffer) => {
    if (datasets.length >= 1) {

      // Synchronous download
      await datasets.reduce(async (previousPromise, dataset) => {
        await previousPromise;
        await downloadSpots(dataset, encodedLoginScoped, buffer);
      }, Promise.resolve());
    }
  };

  // Returns which datasets to show and which takes new Spots, for initializeDownload to set once everything has arrived
  const downloadDatasets = async (selectedProject, encodedLoginScoped) => {
    try {
      dispatch(addedStatusMessage('Downloading Datasets...'));
      const res = await getDatasets(selectedProject.id, encodedLoginScoped);
      const datasets = res?.datasets || [];
      console.log('Datasets Response:', JSON.stringify(res));
      let isTargetDatasetCleared = false;
      let datasetSelection;

      // If same project set active and target dataset to same as before if they still exist
      if (!isEmpty(project) && project.id === selectedProject.id && datasets.length >= 1) {
        const newDatasetIds = datasets.map(d => d.id);
        const updatedActiveDatasetIds = (activeDatasetsIds || []).reduce((acc, prevActiveDatasetId) => {
          console.log('Checking if active dataset still exists:', prevActiveDatasetId);
          return newDatasetIds.includes(prevActiveDatasetId) ? [...acc, prevActiveDatasetId] : acc;
        }, []);
        const activeDatasetIds = isEmpty(updatedActiveDatasetIds) ? [datasets[0].id] : updatedActiveDatasetIds;
        // A target that is not shown would take new Spots out of sight, so the previous target is kept only if it
        // is still among the shown datasets. Otherwise there is none, and which dataset takes new Spots stays the
        // user's choice
        const isPrevTargetDatasetKept = activeDatasetIds.includes(targetDatasetId);
        datasetSelection = {activeDatasetIds, targetDatasetId: isPrevTargetDatasetKept ? targetDatasetId : undefined};
        isTargetDatasetCleared = !!targetDatasetId && !isPrevTargetDatasetKept;
      }
      else if (datasets.length >= 1) {
        datasetSelection = {activeDatasetIds: [datasets[0].id], targetDatasetId: datasets[0].id};
      }
      else {
        const newDataset = createDataset();
        datasetSelection = {activeDatasetIds: [newDataset.id], newDataset, targetDatasetId: newDataset.id};
      }
      datasetsObjToSave = Object.assign({},
        ...datasets.map(item => ({[item.id]: {...item, modified_timestamp: item.modified_timestamp || Date.now()}})));
      await doGetDatasetSpots(datasets, encodedLoginScoped);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Downloaded ' + spotsToSave.length + ' Spots\nDownloaded '
        + Object.keys(datasetsObjToSave).length + ' Datasets\nFinished Downloading Datasets'));
      // The user had a target and did not choose to drop it
      if (isTargetDatasetCleared) {
        dispatch(addedStatusMessage('The previous target dataset was removed or is turned off, so no target '
          + 'dataset is set. Choose one to add new Spots.'));
      }
      return datasetSelection;
    }
    catch (err) {
      console.error('Error getting datasets:', err);
      throw err;
    }
  };

  // A linked Sample Spot's StraboMicro and StraboExperimental data can change after it was uploaded, so fetch it
  // fresh. A sample that can't be fetched keeps what came down with its Spot.
  const downloadLinkedSampleData = async (encodedLoginScoped) => {
    const linkedSpots = spotsToSave.filter(
      spot => spot.properties?.isSample && !isEmpty(getSampleMetadata(spot).strabosamples_id));
    if (isEmpty(linkedSpots)) return;
    if (isEmpty(store.getState().user.straboUserId)) {
      dispatch(addedStatusMessage(`Linked Sample Data Not Downloaded\n${MISSING_STRABO_USER_ID_MESSAGE}`));
      return;
    }
    let fetchedCount = 0;
    dispatch(addedStatusMessage('Downloading Linked Sample Data...'));
    for (const spot of linkedSpots) {
      const strabosamplesId = getSampleMetadata(spot).strabosamples_id;
      try {
        const strabosample = getStraboSampleFromResponse(
          await getStraboSample(strabosamplesId, undefined, encodedLoginScoped));
        if (isEmpty(strabosample?.id)) throw Error('No sample returned');
        STRABOSAMPLES_LINKED_DATA_KEYS.forEach((key) => {
          if (isEmpty(strabosample[key])) delete spot.properties[key];
          else spot.properties[key] = strabosample[key];
        });
        fetchedCount++;
      }
      catch (err) {
        console.warn(spot.properties.id + ': Error Downloading Linked Sample Data for', strabosamplesId, err);
      }
    }
    dispatch(removedLastStatusMessage());
    dispatch(addedStatusMessage(`Downloaded Linked Sample Data for ${fetchedCount} of ${linkedSpots.length} Samples`));
  };

  // Download Project Properties, for initializeDownload to save once everything has arrived. Memo images are saved to
  // the device now, which leaves the open project untouched if the download fails.
  const downloadProject = async (selectedProject, encodedLoginScoped) => {
    try {
      console.log('Downloading Project Properties...');
      dispatch(addedStatusMessage('Downloading Project Properties...'));
      const projectResponse = await getProject(selectedProject.id, encodedLoginScoped);
      // Strip before anything downstream reads it — loadCustomMaps spreads the whole map object through.
      if (!isEmpty(projectResponse.other_maps)) {
        projectResponse.other_maps = projectResponse.other_maps.map(stripMapboxToken);
      }
      console.log('Finished Downloading Project Properties.', projectResponse);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Finished Downloading Project Properties'));
      // Loaded after the message above replaces 'Downloading Project Properties...', or it would replace a map's own
      if (!isEmpty(projectResponse.other_maps)) await loadCustomMaps(projectResponse.other_maps);
      // Web shows memo images from the server and has no device storage to save them to
      if (Platform.OS !== 'web' && !isEmpty(projectResponse.reports)) {
        await downloadReportImages(projectResponse.reports);
      }
      return projectResponse;
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
        // Deleting a memo's last image removes its images key rather than leaving an empty list
        await Promise.all((report.images ?? []).map(async (image) => {
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

  const downloadSpots = async (dataset, encodedLoginScoped,
    buffer = {datasets: datasetsObjToSave, spots: spotsToSave}) => {
    try {
      const featureCollection = await getDatasetSpots(dataset.id, encodedLoginScoped);
      if (isEmpty(featureCollection) || !featureCollection.features) {
        console.log(dataset.name + ': No Spots in dataset.');
      }
      else {
        const spotsDownloaded = featureCollection.features;
        const spotImages = await findNeededImages(spotsDownloaded, dataset);
        if (spotImages) {
          buffer.datasets[dataset.id] = {...buffer.datasets[dataset.id], images: {imageIds: spotImages.imageIds}};
        }
        buffer.spots.push(...spotsDownloaded);
        const spotIds = Object.values(spotsDownloaded).map(spot => spot.properties.id);
        buffer.datasets[dataset.id] = {...buffer.datasets[dataset.id], spotIds: spotIds};
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

  // A My Maps map is kept only if its tiles are found on the custom endpoint; one that isn't is left out on its own
  const loadCustomMaps = async (maps) => {
    await Promise.all(maps.map(async (map) => {
      if (!map.id) {
        console.warn('Skipping custom map with no id', map);
        return;
      }
      const mapId = normalizeCustomMapId(map.id, map.source);
      let providerInfo = MAP_PROVIDERS[map.source];
      if (map.source === CUSTOM_MAP_SOURCES.STRABO_MY_MAPS && !isEmpty(endpoint) && isSelected) {
        if (!await testCustomMapUrl(endpoint.replace('/db', '/strabo_mymaps_check/') + map.id)) {
          console.warn(map.id + ': My Maps map not found on the custom endpoint', map);
          dispatch(addedStatusMessage(`Custom Map Not Loaded: ${map.title || map.id}`));
          return;
        }
        providerInfo = {...providerInfo, url: [endpoint.replace('/db', '/geotiff/tiles/')]};
      }
      const customMap = {
        ...map,
        ...providerInfo,
        id: mapId,
        source: map.source,
      };
      console.log(customMap.id + ': Loaded Custom Map', customMap);
      customMapsToSave = {...customMapsToSave, [customMap.id]: customMap};
    }));
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
    // A download can replace the open project while this is fetching, and what was fetched belongs to the old one
    const projectId = project.id;
    const isSameProjectOpen = () => store.getState().project.project?.id === projectId;
    if (staleDatasets.length) {
      const buffer = {datasets: {}, spots: []};
      await doGetDatasetSpots(staleDatasets, encodedLogin, buffer);
      if (!isSameProjectOpen()) return;
      dispatch(addedSpotsFromServer(buffer.spots));
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
            ...(buffer.datasets[serverDataset.id] || {}),
          }));
          // Local now matches the server for this dataset - record it as the new base.
          appliedBaseTimestamps[serverDataset.id] = timestamp;
        });
      if (!isEmpty(appliedBaseTimestamps)) dispatch(setLastSyncedDatasetTimestamps(appliedBaseTimestamps));
      // Loads don't flag a device save (listenerMiddleware), but a pull lands in the open project, so save it too
      dispatch(setLocalSaveNeeded());
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
      const serverProject = await getProject(projectId, encodedLogin);
      const liveProject = store.getState().project.project;
      if (serverProject && isSameProjectOpen() && serverProject.modified_timestamp >= liveProject.modified_timestamp
        && !store.getState().connections.isProjectSyncNeeded) {
        dispatch(addedProjectFromServer(serverProject));
        // Local now matches the server for the project - record it as the new base.
        dispatch(setLastSyncedProjectTimestamp(serverProject.modified_timestamp));
        // Applied every cycle the server's copy is no older, so a save only when it brought something new
        if (!isEqual(store.getState().project.project, liveProject)) dispatch(setLocalSaveNeeded());
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
      // A native modal is animating out right now — either the project-load modal (dismissed just above) or the
      // overwrite-confirm modal (closed before this ran). On iOS, presenting the status modal in the same beat runs a
      // native present and dismiss at once and trips UIViewControllerHierarchyInconsistency (Sentry STRABOSPOT-2-6JN).
      // Let it finish dismissing first.
      if (Platform.OS === 'ios') await new Promise(resolve => setTimeout(resolve, MODAL_TRANSITION_DELAY));
      // Saved before the status modal opens, so a failure's question never shows over it
      const {hasFailed, hasSaved} = await autoSaveNow();
      if (hasFailed && !await confirmDownloadWithoutBackup()) return false;
      dispatch(setIsStatusMessagesModalVisible(true));
      dispatch(setLoadingStatus({view: 'modal', bool: true}));
      if (hasSaved) dispatch(addedStatusMessage('Saved a backup of the current project to the device.'));
      if (hasFailed) dispatch(addedStatusMessage('Could not save a backup of the current project to the device.'));
      dispatch(addedStatusMessage(`Downloading Project: ${projectName}`));
      const projectResponse = await downloadProject(selectedProject, encodedLoginScoped);
      const datasetSelection = await downloadDatasets(selectedProject, encodedLoginScoped);
      await downloadLinkedSampleData(encodedLoginScoped);
      console.log('Download Complete! Spots Downloaded!');
      dispatch(addedStatusMessage('------------------'));
      // The open project is replaced only now, so a download that fails partway leaves it as it was
      if (!isEmpty(project)) clearProject();
      // Reset before loading, so a change made below (a dataset for a project with none) stays flagged
      dispatch(resetSyncState());
      dispatch(addedProjectFromServer(projectResponse));
      // Seed the base for every downloaded dataset and the project: local now matches the server exactly.
      dispatch(setLastSyncedProjectTimestamp(store.getState().project.project.modified_timestamp));
      dispatch(setLastSyncedDatasetTimestamps(
        Object.fromEntries(Object.values(datasetsObjToSave).map(d => [d.id, d.modified_timestamp])),
      ));
      dispatch(addedSpotsFromServer(spotsToSave));
      dispatch(addedDatasets(datasetsObjToSave));
      // Made here for a project with none, so dispatched as a change to save rather than loaded
      if (datasetSelection.newDataset) dispatch(addedDataset(datasetSelection.newDataset));
      dispatch(setActiveDatasetsMultiple(datasetSelection.activeDatasetIds));
      dispatch(setTargetDataset(datasetSelection.targetDatasetId));
      dispatch(addedCustomMapsFromBackup(customMapsToSave));
      dispatch(addedStatusMessage('Complete!'));
      return true;
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
