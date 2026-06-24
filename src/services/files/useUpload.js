import {useState} from 'react';
import {Platform} from 'react-native';

import KeepAwake from 'react-native-keep-awake';
import {useDispatch, useSelector} from 'react-redux';

import useUploadImages from './useUploadImages';
import {
  clearProjectSyncNeeded,
  removePendingDatasetId,
  setPendingImagesChanges,
} from '../../modules/connections/connections.slice';
import {addedStatusMessage} from '../../modules/home/home.slice';
import {
  addedDataset,
  addedProject,
  addedProjectFromServer,
  deletedSpotIdFromDataset,
  setIsImageTransferring,
} from '../../modules/project/projects.slice';
import useProject from '../../modules/project/useProject';
import {useSpots} from '../../modules/spots';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {store} from '../../store/ConfigureStore';
import useServerRequests from '../network/useServerRequests';

let projectUploadStatus = {};

const useUpload = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);
  const user = useSelector(state => state.user);

  const {checkValidDateTime} = useProject();
  const {
    addDatasetToProject,
    deleteAllSpotsInDataset,
    updateDataset,
    updateDatasetSpots,
    updateProfile,
    updateProject,
    uploadWebImage,
  } = useServerRequests();
  const {getSpotsByIds} = useSpots();
  const {initializeImageUpload} = useUploadImages();

  /* Local State */

  const [uploadStatusMessage, setUploadStatusMessage] = useState('');

  /* Internal Functions */

  const uploadDataset = async (dataset) => {
    try {
      setUploadStatusMessage(`Uploading dataset ${dataset.name}...`);
      let datasetCopy = JSON.parse(JSON.stringify(dataset));
      delete datasetCopy.spotIds;
      datasetCopy.images && delete datasetCopy.images;
      const resJSON = await updateDataset(datasetCopy);
      if (resJSON.modified_on_server) {
        console.log('Dataset that was uploaded:', resJSON);
        await addDatasetToProject(project.id, dataset.id);
        setUploadStatusMessage(`Finished uploading dataset ${dataset.name}...`);
        await uploadSpots(dataset);
        dispatch(removePendingDatasetId(dataset.id));
      }
      else {
        // Rejected (server copy newer). Bump the timestamp so the next cycle retries; local wins.
        setUploadStatusMessage(`Dataset ${dataset.name} was rejected by the server; will retry.`);
        dispatch(addedDataset({...dataset, modified_timestamp: Date.now()}));
      }
    }
    catch (err) {
      console.error(dataset.name + ': Error Uploading Dataset Properties...', err);
      throw Error(err);
    }
  };

  // Upload Spots
  const uploadSpots = async (dataset) => {
    let datasetSpots;
    if (dataset.spotIds) {
      datasetSpots = getSpotsByIds(dataset.spotIds);
      datasetSpots.forEach(spotValue => checkValidDateTime(spotValue));
    }
    try {
      if (isEmpty(datasetSpots)) {
        setUploadStatusMessage('There are no spots to upload.');
        await deleteAllSpotsInDataset(dataset.id);
      }
      else {
        const spotCollection = {
          type: 'FeatureCollection',
          features: Object.values(datasetSpots),
        };
        console.log(dataset.name + ': Uploading Spots...', spotCollection);
        setUploadStatusMessage(`Uploading ${dataset.name} spots...`);
        await updateDatasetSpots(dataset.id, spotCollection);
        setUploadStatusMessage(`Finished uploading ${dataset.name} spots.`);
      }
    }
    catch (err) {
      console.error(dataset.name + ': Error Uploading Project Spots.', err);
      setUploadStatusMessage(`${dataset.name}: Error Uploading Spots.\n\n ${err}\n`);
      // Added this below to handle spots that were getting added to 2 datasets, which the server will not accept
      const errMsg = typeof err === 'string' ? err : (err?.message ?? String(err));
      if (errMsg.startsWith('Spot(s) already exist in another dataset')) {
        const spotId = parseInt(errMsg.split(')')[1].split('(')[1].split(')')[0], 10);
        // console.log('dupes', spotId);
        dispatch(deletedSpotIdFromDataset({datasetId: dataset.id, spotId: spotId}));
        alert('Fixed Spot in Another Dataset Error',
          'Spot removed from ' + dataset.name + '. Please try uploading again.');
      }
      throw Error(err);
    }
  };

  /* Exported Functions */

  const initializeUpload = async () => {
    if (Platform.OS !== 'web') KeepAwake.activate();
    try {
      console.log('Initializing Upload...');
      await uploadProject();
      await uploadDatasets();
      if (Platform.OS !== 'web') {
        const imageStatus = await initializeImageUpload();
        projectUploadStatus = {...projectUploadStatus, images: imageStatus};
        // Clear the pending flag unless some images failed, so the status icon stops showing
        // "Pending Image Upload" after a successful manual upload (mirrors the auto-sync path).
        dispatch(setPendingImagesChanges((imageStatus?.failed || 0) > 0));
        dispatch(setIsImageTransferring(false));
        KeepAwake.deactivate();
      }
      return projectUploadStatus;
    }
    catch (err) {
      dispatch(addedStatusMessage(`\nUpload Failed!\n\n ${err}`));
      console.error('Upload Failed!', err);
      throw Error(err);
    }
  };

  // Upload the given datasets sequentially (server can't handle parallel dataset writes)
  const uploadDatasetsSequentially = async (datasets, label) => {
    if (!datasets.length) {
      console.log('No Datasets Found.');
      return true;
    }
    setUploadStatusMessage(`Uploading ${datasets.length} ${label}datasets...\n`);
    for (const dataset of datasets) {
      await uploadDataset(dataset);
    }
    projectUploadStatus = {...projectUploadStatus, datasets: 'uploaded'};
    console.log('Completed uploading datasets!');
    setUploadStatusMessage(
      `Finished uploading ${datasets.length} ${label}Dataset${datasets.length === 1 ? '!' : 's!'}\n`);
    return true;
  };

  // Upload all datasets in the project
  const uploadDatasets = () =>
    uploadDatasetsSequentially(Object.values(store.getState().project.datasets), '');

  // Upload only the datasets whose IDs are in the provided list. Read live from the store: an async
  // caller can close over a stale `projectDatasets` snapshot, sending an out-of-date timestamp the
  // server rejects as not-newer (modified_on_server: false), which wastes a sync cycle.
  const uploadDatasetsByIds = (datasetIds) => {
    const liveDatasets = store.getState().project.datasets;
    return uploadDatasetsSequentially(datasetIds.map(id => liveDatasets[id]).filter(Boolean), 'modified ');
  };

  const uploadFromWeb = async (imageId, imageFile) => {
    try {
      dispatch(setIsImageTransferring(true));
      let formData = new FormData();
      formData.append('name', imageFile.name);
      formData.append('image_file', imageFile);
      formData.append('id', imageId);
      formData.append('modified_timestamp', Date.now());

      const res = await uploadWebImage(formData, user.encoded_login);
      console.log('Image Upload Res', res);
      return res;
    }
    catch (err) {
      console.log('Error Uploading Image', err);
      dispatch(setIsImageTransferring(false));
      throw Error;
    }
  };

  const uploadProfile = async (userValues) => {
    try {
      await updateProfile(userValues);
    }
    catch (err) {
      console.error('Error uploading profile:', err);
      throw Error('Error uploading profile:', err);
    }
  };

  // Upload Project Properties
  const uploadProject = async () => {
    // Read live from the store: an async caller (e.g. trySync) can close over a stale `project`
    // snapshot, which would make uploadedTimestamp mismatch the live store and never clear the flag.
    const liveProject = store.getState().project.project;
    console.log(`Uploading ${liveProject.description.project_name} Properties...`);
    setUploadStatusMessage(`Uploading ${liveProject.description.project_name} Properties...`);
    console.log('Uploading Project JSON', JSON.stringify(liveProject));
    const uploadedTimestamp = liveProject.modified_timestamp;
    const uploadProjectResponse = await updateProject(liveProject);
    console.log('Response Project JSON', JSON.stringify(uploadProjectResponse));

    // /project gives no accept/reject signal; acceptance = server echoed back our timestamp.
    const isAccepted = !isEmpty(uploadProjectResponse)
      && uploadProjectResponse.modified_timestamp === uploadedTimestamp;
    // Skip acting on the response if a newer local edit landed mid-flight (already flagged for sync, retries next cycle).
    const noNewerLocalEdit = store.getState().project.project.modified_timestamp === uploadedTimestamp;

    if (isAccepted && noNewerLocalEdit) {
      // Apply server-merged data (tags, reports, templates) back; already in sync so don't re-flag for sync.
      dispatch(addedProjectFromServer(uploadProjectResponse));
      dispatch(clearProjectSyncNeeded());
    }
    else if (!isAccepted && !isEmpty(uploadProjectResponse) && noNewerLocalEdit) {
      // Rejected (server copy newer). Bump the timestamp so the next cycle retries; local wins.
      dispatch(addedProject({...liveProject, modified_timestamp: Date.now()}));
    }
    setUploadStatusMessage(`Finished uploading ${liveProject.description.project_name} Properties.`);
    return true;
  };

  return {
    initializeUpload,
    uploadDatasets,
    uploadDatasetsByIds,
    uploadFromWeb,
    uploadProfile,
    uploadProject,
    uploadStatusMessage,
  };
};

export default useUpload;
