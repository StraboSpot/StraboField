import {useState} from 'react';
import {Platform} from 'react-native';

import KeepAwake from 'react-native-keep-awake';
import {useDispatch, useSelector} from 'react-redux';

import useServerRequests from './useServerRequests';
import useUploadImages from './useUploadImages';
import {addedStatusMessage} from '../modules/home/home.slice';
import {deletedSpotIdFromDataset, setIsImageTransferring} from '../modules/project/projects.slice';
import useProject from '../modules/project/useProject';
import {useSpots} from '../modules/spots';
import {isEmpty} from '../shared/Helpers';
import alert from '../shared/ui/alert';

const useUpload = () => {
  let projectUploadStatus = {};
  const datasetsNotUploaded = [];

  const dispatch = useDispatch();
  const projectDatasets = useSelector(state => state.project.datasets);
  const project = useSelector(state => state.project.project);
  const user = useSelector(state => state.user);

  const [uploadStatusMessage, setUploadStatusMessage] = useState('');

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

  const initializeUpload = async () => {
    Platform.OS !== 'web' && KeepAwake.activate();
    try {
      await uploadProject();
      await uploadDatasets();
      const imageStatus = await initializeImageUpload();
      projectUploadStatus = {...projectUploadStatus, images: imageStatus};
      // projectUploadStatus = {...projectUploadStatus, images: imageStatus};
      dispatch(setIsImageTransferring(false));
      Platform.OS !== 'web' && KeepAwake.deactivate();
      return projectUploadStatus;
    }
    catch (err) {
      dispatch(addedStatusMessage(`\nUpload Failed!\n\n ${err}`));
      console.error('Upload Failed!', err);
      throw Error(err);
    }
  };

  const uploadDataset = async (dataset) => {
    try {
      // dispatch(addedStatusMessage(`\n${dataset.name}\n`));
      setUploadStatusMessage(`Uploading dataset ${dataset.name}...`);
      let datasetCopy = JSON.parse(JSON.stringify(dataset));
      delete datasetCopy.spotIds;
      datasetCopy.images && delete datasetCopy.images;
      const resJSON = await updateDataset(datasetCopy, user.encoded_login);
      if (resJSON.modified_on_server) {
        console.log('Dataset that was uploaded:', resJSON);
        // console.log(dataset.name + ': Uploading Dataset Properties...');
        // dispatch(addedStatusMessage('Uploading properties...'));
        await addDatasetToProject(project.id, dataset.id, user.encoded_login);
        setUploadStatusMessage(`Finished uploading dataset ${dataset.name}...`);
        // dispatch(removedLastStatusMessage());
        await uploadSpots(dataset);
      }
      else {
        setUploadStatusMessage(`Dataset ${dataset.name} had no changes.`);
        datasetsNotUploaded.push(datasetCopy);
        // console.log(`Did not upload: Dataset ${datasetCopy.name} has not changed or is newer.`);
      }
    }
    catch (err) {
      console.error(dataset.name + ': Error Uploading Dataset Properties...', err);
      // dispatch(addedStatusMessage(`Error Uploading Dataset Properties!\n ${err}`));
      throw Error(err);
    }
  };

  // Synchronously Upload Datasets
  const uploadDatasets = async () => {
    let currentRequest = 0;
    const datasets = Object.values(projectDatasets);

    const makeNextDatasetRequest = async () => {
      await uploadDataset(datasets[currentRequest]);
      currentRequest++;
      if (currentRequest < datasets.length) await makeNextDatasetRequest();
    };

    if (Object.values(projectDatasets).length === 0) {
      console.log('No Datasets Found.');
      // throw Error('No Datasets Found.');
    }
    else if (currentRequest < Object.values(projectDatasets).length) {
      setUploadStatusMessage(`Uploading ${datasets.length} datasets...\n`);
      await makeNextDatasetRequest();
      // projectUploadStatus = {...projectUploadStatus, datasets: true};
      projectUploadStatus = {...projectUploadStatus, datasets: 'uploaded'};
      console.log('Completed Uploading Datasets!');
      setUploadStatusMessage(
        `Finished uploading ${datasets.length} Dataset${(datasets.length === 1 ? '!' : 's!')}\n`);
    }
    return true;
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
      const profileData = {name: userValues.name, mapboxToken: userValues.mapboxToken};
      await updateProfile(profileData);
    }
    catch (err) {
      console.error('Error uploading profile image', err);
      throw Error('Error uploading profile image', err);
    }
  };

  // Upload Project Properties
  const uploadProject = async () => {
    console.log(`Uploading ${project.description.project_name} Properties...`);
    setUploadStatusMessage(`Uploading ${project.description.project_name} Properties...`);
    await updateProject(project, user.encoded_login);
    setUploadStatusMessage(`Finished uploading ${project.description.project_name} Properties.`);
    return true;
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
        await deleteAllSpotsInDataset(dataset.id, user.encoded_login);
      }
      else {
        const spotCollection = {
          type: 'FeatureCollection',
          features: Object.values(datasetSpots),
        };
        console.log(dataset.name + ': Uploading Spots...', spotCollection);
        setUploadStatusMessage(`Uploading ${dataset.name} spots...`);
        await updateDatasetSpots(dataset.id, spotCollection, user.encoded_login);
        setUploadStatusMessage(`Finished uploading ${dataset.name} spots.`);
        // dispatch(removedLastStatusMessage());
        // dispatch(addedStatusMessage('\nFinished uploading spots.\n'));
        // await uploadImages(Object.values(datasetSpots), dataset.name);
      }
    }
    catch (err) {
      console.error(dataset.name + ': Error Uploading Project Spots.', err);
      setUploadStatusMessage(`${dataset.name}: Error Uploading Spots.\n\n ${err}\n`);
      // Added this below to handle spots that were getting added to 2 datasets, which the server will not accept
      if (err?.startsWith('Spot(s) already exist in another dataset')) {
        const spotId = parseInt(err.split(')')[1].split('(')[1].split(')')[0], 10);
        // console.log('dupes', spotId);
        dispatch(deletedSpotIdFromDataset({datasetId: dataset.id, spotId: spotId}));
        alert('Fixed Spot in Another Dataset Error',
          'Spot removed from ' + dataset.name + '. Please try uploading again.');
      }
      throw Error(err);
    }
  };

  return {
    initializeUpload,
    uploadDatasets,
    uploadFromWeb,
    uploadProfile,
    uploadProject,
    uploadStatusMessage,
  };
};

export default useUpload;
