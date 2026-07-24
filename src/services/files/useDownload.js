import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import {clearLocalSaveNeeded} from '../../modules/connections/connections.slice';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setIsErrorMessagesModalVisible,
  setIsProjectLoadSelectionModalVisible,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
  setStatusMessageModalTitle,
} from '../../modules/home/home.slice';
import {useImages} from '../../modules/images';
import {MAP_PROVIDERS} from '../../modules/maps/maps.constants';
import {addedCustomMapsFromBackup} from '../../modules/maps/maps.slice';
import {
  addedDataset,
  addedDatasets,
  addedProjectFromServer,
  setActiveDatasets,
  setActiveDatasetsMultiple,
  setTargetDataset,
} from '../../modules/project/projects.slice';
import useProject from '../../modules/project/useProject';
import {addedSpotsFromServer} from '../../modules/spots/spots.slice';
import {setUserData} from '../../modules/user/userProfile.slice';
import {isEmpty} from '../../shared/helpers';
import useResetState from '../../store/useResetState';
import useDevice from '../device/useDevice';
import useServerRequests from '../network/useServerRequests';

let customMapsToSave = {};
let datasetsObjToSave = {};
let imagesDownloadedCount = 0;
let imagesFailedCount = 0;
let spotsToSave = [];
let prevActiveDatasetsIds, prevTargetDatasetId;

const useDownload = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {activeDatasetsIds, project, targetDatasetId} = useSelector(state => state.project);
  const spots = useSelector(state => state.spot.spots);
  const {encoded_login: encodedLogin} = useSelector(state => state.user);
  const {endpoint, isSelected} = useSelector(state => state.connections.databaseEndpoint);

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
    prevActiveDatasetsIds = undefined;
    prevTargetDatasetId = undefined;
  };

  /* Internal Functions */

  const doGetDatasetSpots = async (datasets, encodedLoginScoped) => {
    if (datasets.length >= 1) {
      // console.log('Starting Dataset Spots Download!');

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

      // Same project re-downloaded — restore active/target from before if they still exist
      if (!isEmpty(project) && project.id === selectedProject.id && datasets.length >= 1) {
        const newDatasetIds = datasets.map(d => d.id);
        const retainedActiveDatasetIds = prevActiveDatasetsIds.filter(id => newDatasetIds.includes(id));
        if (retainedActiveDatasetIds.length >= 1) {
          if (retainedActiveDatasetIds.length === 1) {
            dispatch(setActiveDatasets({bool: true, dataset: retainedActiveDatasetIds[0]}));
          }
          else dispatch(setActiveDatasetsMultiple(retainedActiveDatasetIds));
          const prevTargetDataset = datasets.find(d => d.id === prevTargetDatasetId);
          if (prevTargetDataset && !prevTargetDataset.isReadOnly) {
            dispatch(setActiveDatasets({bool: true, dataset: prevTargetDatasetId}));
            dispatch(setTargetDataset(prevTargetDatasetId));
          }
          else {
            const firstWritableDataset = datasets.find(d => retainedActiveDatasetIds.includes(d.id) && !d.isReadOnly)
              || datasets.find(d => !d.isReadOnly);
            if (firstWritableDataset) {
              dispatch(setActiveDatasets({bool: true, dataset: firstWritableDataset.id}));
              dispatch(setTargetDataset(firstWritableDataset.id));
            }
          }
        }
        else setFirstWritableActiveAndTarget(datasets);
      }
      else if (datasets.length >= 1) setFirstWritableActiveAndTarget(datasets);
      else {
        const targetDataset = createDataset();
        dispatch(addedDataset(targetDataset));
        dispatch(setActiveDatasets({bool: true, dataset: targetDataset.id}));
        dispatch(setTargetDataset(targetDataset.id));
      }
      datasetsObjToSave = Object.assign({},
        ...datasets.map(item => ({[item.id]: {...item, modified_timestamp: item.modified_timestamp || Date.now()}})));
      await doGetDatasetSpots(datasets, encodedLoginScoped);
    }
    catch (e) {
      console.log('Error getting datasets...' + e);
      throw Error;
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
          if (!isEmpty(activeDatasetsIds)) prevActiveDatasetsIds = activeDatasetsIds;
          if (targetDatasetId) prevTargetDatasetId = targetDatasetId;
        }
        clearProject();
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
      throw Error;
    }
  };

  const downloadReportImages = async (reports) => {
    try {
      let neededImagesIds = [];
      await Promise.all(reports.map(async (report) => {
        await Promise.all(report.images?.map(async (image) => {
          const doesExist = await doesImageExistOnDevice(image.id);
          if (!doesExist) {
            console.log('Need to download report image:', image.id);
            neededImagesIds.push(image.id);
          }
          else console.log('Image', image.id, 'already exists on device. Not downloading.');
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
      // console.log(dataset.name, ':', 'Downloading Spots...');
      const featureCollection = await getDatasetSpots(dataset.id, encodedLoginScoped);
      // console.log(dataset.name, ':', 'Finished Downloading Spots.');
      if (isEmpty(featureCollection) || !featureCollection.features) {
        // console.log(dataset.name, ': No Spots in dataset.');
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
        // console.log(dataset.name, ':', 'Got Spots', spotsDownloaded);
      }
    }
    catch (err) {
      console.error(dataset.name, ':', 'Error Downloading Spots.', err);
      dispatch(addedStatusMessage('Error Downloading Spots.' + err));
      throw Error;
    }
  };

  const findNeededImages = async (spotsDownloaded, dataset) => {
    try {
      // console.log(dataset.name, ':', 'Gathering Needed Images...');
      const spotImages = await gatherNeededImages(spotsDownloaded, dataset);
      if (spotImages?.imageIds.length > 0) {
        // console.log(dataset.name, ':', 'Images needed', spotImages.neededImagesIds.length, 'of', spotImages?.imageIds.length);
        return spotImages;
      }
      else {
        console.log(dataset.name, ':', 'No Images in dataset.');
        return undefined;
      }
    }
    catch (err) {
      console.error(dataset.name, ':', 'Error Gathering Images. Error:', err);
    }
  };

  const loadCustomMaps = (maps) => {
    maps.map(async (map) => {
      let mapId = map.id;
      // Pull out mapbox styles map id
      if (map.source === 'mapbox_styles' && map.id.includes('mapbox://styles/')) {
        mapId = map.id.split('/').slice(3).join('/');
      }
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
        key: map.accessToken || map.key,
        source: map.source,
      };
      console.log(customMap);
      customMapsToSave = {...customMapsToSave, [customMap.id]: customMap};
    });
  };

  // Sets the first non-read-only dataset as both the active and target dataset
  // falls back to datasets[0] for the active dataset if all are read-only
  const setFirstWritableActiveAndTarget = (datasets) => {
    const firstWritableDataset = datasets.find(d => !d.isReadOnly);
    if (firstWritableDataset) {
      dispatch(setActiveDatasets({bool: true, dataset: firstWritableDataset.id}));
      dispatch(setTargetDataset(firstWritableDataset.id));
    }
    else dispatch(setActiveDatasets({bool: true, dataset: datasets[0].id}));
  };

  /* Exported Functions */

  const downloadUserProfile = async (encodedLoginScoped = encodedLogin) => {
    try {
      let userProfileRes = await getProfile(encodedLoginScoped);

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
      throw Error(err);
    }
  };

  const initializeDownload = async (selectedProject, encodedLoginScoped = encodedLogin) => {
    resetDownloadState();
    if (setIsProjectLoadSelectionModalVisible) dispatch(setIsProjectLoadSelectionModalVisible(false));
    const projectName = selectedProject.name || selectedProject?.description?.project_name || 'Unknown';
    dispatch(setStatusMessageModalTitle(projectName));
    dispatch(clearedStatusMessages());
    dispatch(setIsStatusMessagesModalVisible(true));
    dispatch(setLoadingStatus({view: 'modal', bool: true}));
    dispatch(addedStatusMessage(`Downloading Project: ${projectName}`));
    try {
      await downloadProject(selectedProject, encodedLoginScoped);
      await downloadDatasets(selectedProject, encodedLoginScoped);
      console.log('Download Complete! Spots Downloaded!');
      dispatch(addedStatusMessage('------------------'));
      dispatch(addedSpotsFromServer(spotsToSave));
      dispatch(addedDatasets(datasetsObjToSave));
      dispatch(addedCustomMapsFromBackup(customMapsToSave));
      dispatch(clearLocalSaveNeeded());
      dispatch(addedStatusMessage('Complete!'));
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      return datasetsObjToSave;
    }
    catch (err) {
      console.error('Error Initializing Download.', err);
      if (Platform.OS === 'web') {
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('Error loading project!', err));
        dispatch(setIsErrorMessagesModalVisible(true));
      }
      else dispatch(addedStatusMessage('Download Failed!', err));
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      throw Error;
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
        dispatch(setLoadingStatus({view: 'modal', bool: false}));
      }
    }
    catch (err) {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Downloading Images!'));
      dispatch(addedStatusMessage('Complete!'));
      console.warn('Error Downloading Images: ' + err);
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
    }
  };

  return {
    downloadUserProfile,
    initializeDownload,
    initializeDownloadImages,
  };
};

export default useDownload;
